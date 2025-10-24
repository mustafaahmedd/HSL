'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Select } from '@/components/ui';
import { IAuction, IBid, IAuctionSession } from '@/types/Auction';
import { IPlayer } from '@/types/Player';
import { ITeam } from '@/types/Team';

export default function PublicAuctionView() {
    const router = useRouter();
    const params = useParams();
    const auctionId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [auction, setAuction] = useState<IAuction | null>(null);
    const [session, setSession] = useState<IAuctionSession | null>(null);
    const [currentPlayer, setCurrentPlayer] = useState<IPlayer | null>(null);
    const [currentBid, setCurrentBid] = useState<IBid | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [teams, setTeams] = useState<ITeam[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [bidAmount, setBidAmount] = useState<number>(0);
    const [biddingHistory, setBiddingHistory] = useState<IBid[]>([]);

    useEffect(() => {
        if (auctionId) {
            fetchAuctionData();
        }
    }, [auctionId]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (session?.isActive && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [session?.isActive, timeRemaining]);

    useEffect(() => {
        // Auto-refresh auction data every 5 seconds when live
        let refreshInterval: NodeJS.Timeout;
        if (auction?.status === 'live') {
            refreshInterval = setInterval(() => {
                fetchAuctionData();
            }, 5000);
        }
        return () => clearInterval(refreshInterval);
    }, [auction?.status]);

    const fetchAuctionData = async () => {
        try {
            const response = await fetch(`/api/auction/${auctionId}`);
            const data = await response.json();

            if (data.success) {
                setAuction(data.auction);
                setSession(data.session);
                setTeams(data.auction.teams || []);

                if (data.session?.currentPlayerId) {
                    setCurrentPlayer(data.session.currentPlayerId);
                }
                if (data.session?.currentHighestBid) {
                    setCurrentBid(data.session.currentHighestBid);
                    setBidAmount(data.session.currentHighestBid.amount + (data.auction.biddingIncrement || 50));
                } else if (data.auction?.basePrice) {
                    setBidAmount(data.auction.basePrice);
                }

                if (data.session?.biddingEndTime) {
                    const now = new Date();
                    const endTime = new Date(data.session.biddingEndTime);
                    setTimeRemaining(Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000)));
                }

                // Fetch bidding history
                const bidsResponse = await fetch(`/api/auction/bid?auctionId=${auctionId}`);
                const bidsData = await bidsResponse.json();
                if (bidsData.success) {
                    setBiddingHistory(bidsData.bids);
                }
            }
        } catch (error) {
            console.error('Failed to fetch auction data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceBid = async () => {
        if (!selectedTeam || !bidAmount) {
            alert('Please select a team and enter bid amount');
            return;
        }

        try {
            const response = await fetch('/api/auction/bid', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    auctionId,
                    playerId: currentPlayer?._id,
                    teamId: selectedTeam,
                    amount: bidAmount,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCurrentBid(data.bid);
                setBidAmount(data.bid.amount + (auction?.biddingIncrement || 50));
                fetchAuctionData();
            } else {
                alert(data.error || 'Failed to place bid');
            }
        } catch (error) {
            console.error('Failed to place bid:', error);
            alert('Failed to place bid');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-800';
            case 'live': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!auction) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Auction Not Found</h2>
                    <Link href="/">
                        <Button variant="primary">Back to Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{auction.name}</h1>
                        <p className="text-gray-600">{(auction.eventId as any)?.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(auction.status)}`}>
                            {auction.status.toUpperCase()}
                        </span>
                        <Link href="/">
                            <Button variant="secondary">Back to Home</Button>
                        </Link>
                    </div>
                </div>

                {/* Auction Status */}
                <Card title="Auction Status" className="mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{auction.players.length}</div>
                            <div className="text-sm text-gray-600">Total Players</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{auction.teams.length}</div>
                            <div className="text-sm text-gray-600">Registered Teams</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">PKR {auction.totalRevenue.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">Total Revenue</div>
                        </div>
                    </div>
                </Card>

                {/* Live Auction Interface */}
                {auction.status === 'live' && session?.isActive ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Current Player */}
                        <Card title="Current Player">
                            {currentPlayer ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-2xl font-bold">{currentPlayer.name}</h3>
                                            <p className="text-gray-600">{currentPlayer.type}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentPlayer.category === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                                            currentPlayer.category === 'Diamond' ? 'bg-blue-100 text-blue-800' :
                                                currentPlayer.category === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {currentPlayer.category}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Contact:</span>
                                            <span className="font-medium">{currentPlayer.contactNo}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Timings:</span>
                                            <span className="font-medium">{currentPlayer.timings}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Base Price:</span>
                                            <span className="font-bold text-green-600">PKR {auction.basePrice.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-4xl mb-4">⏸️</div>
                                    <p>No player currently being auctioned</p>
                                    <p className="text-sm">Please wait for the next player...</p>
                                </div>
                            )}
                        </Card>

                        {/* Bidding Interface */}
                        <Card title="Bidding">
                            {currentPlayer ? (
                                <div className="space-y-4">
                                    {/* Current Highest Bid */}
                                    <div className="bg-white p-4 rounded-lg border">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Current Highest Bid:</span>
                                            <span className="text-2xl font-bold text-green-600">
                                                PKR {currentBid?.amount.toLocaleString() || auction.basePrice.toLocaleString()}
                                            </span>
                                        </div>
                                        {currentBid && (
                                            <p className="text-sm text-gray-600 mb-2">
                                                By: {currentBid.bidderInfo.teamName} ({currentBid.bidderInfo.ownerName})
                                            </p>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Time Remaining:</span>
                                            <span className={`text-lg font-bold ${timeRemaining < 30 ? 'text-red-600' : 'text-gray-900'}`}>
                                                {formatTime(timeRemaining)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bidding Form */}
                                    <div className="space-y-4">
                                        <Select
                                            label="Select Your Team"
                                            value={selectedTeam}
                                            onChange={(e) => setSelectedTeam(e.target.value)}
                                            options={[
                                                { value: '', label: 'Choose your team...' },
                                                ...teams.map(team => ({
                                                    value: team._id?.toString() || '',
                                                    label: `${team.name} (${team.owner}) - PKR ${team.pointsLeft.toLocaleString()} remaining`
                                                }))
                                            ]}
                                        />

                                        <Input
                                            label="Bid Amount (PKR)"
                                            type="number"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
                                            min={currentBid ? currentBid.amount + auction.biddingIncrement : auction.basePrice}
                                            step={auction.biddingIncrement}
                                        />

                                        <Button
                                            variant="primary"
                                            className="w-full"
                                            onClick={handlePlaceBid}
                                            disabled={!selectedTeam || !bidAmount || timeRemaining === 0}
                                        >
                                            Place Bid
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-4xl mb-4">⏸️</div>
                                    <p>Bidding is not active</p>
                                    <p className="text-sm">Please wait for the next player...</p>
                                </div>
                            )}
                        </Card>
                    </div>
                ) : auction.status === 'upcoming' ? (
                    <Card title="Auction Information" className="mb-8">
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">⏰</div>
                            <h3 className="text-xl font-semibold mb-2">Auction Not Started Yet</h3>
                            <p className="text-gray-600 mb-4">
                                This auction will begin on {new Date(auction.auctionDate).toLocaleDateString()} at {new Date(auction.auctionDate).toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-gray-500">
                                Please check back later or contact the organizer for more information.
                            </p>
                        </div>
                    </Card>
                ) : auction.status === 'completed' ? (
                    <Card title="Auction Completed" className="mb-8">
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">✅</div>
                            <h3 className="text-xl font-semibold mb-2">Auction Completed</h3>
                            <p className="text-gray-600 mb-4">
                                This auction has finished. Thank you for participating!
                            </p>
                            <p className="text-sm text-gray-500">
                                Total Revenue: PKR {auction.totalRevenue.toLocaleString()}
                            </p>
                        </div>
                    </Card>
                ) : (
                    <Card title="Auction Cancelled" className="mb-8">
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">❌</div>
                            <h3 className="text-xl font-semibold mb-2">Auction Cancelled</h3>
                            <p className="text-gray-600 mb-4">
                                This auction has been cancelled. Please contact the organizer for more information.
                            </p>
                        </div>
                    </Card>
                )}

                {/* Bidding History */}
                {auction.status === 'live' && biddingHistory.length > 0 && (
                    <Card title="Recent Bids" className="mb-8">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Player
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Team
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {biddingHistory.slice(0, 10).map((bid) => (
                                        <tr key={bid._id?.toString()}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {(bid.playerId as any)?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {bid.bidderInfo.teamName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                                                PKR {bid.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(bid.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${bid.isWinning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {bid.isWinning ? 'Winning' : 'Outbid'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Team Rankings */}
                {auction.status === 'live' && teams.length > 0 && (
                    <Card title="Team Rankings">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rank
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Team Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Owner
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Budget Remaining
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Players Bought
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {teams
                                        .sort((a, b) => b.pointsLeft - a.pointsLeft)
                                        .map((team, index) => (
                                            <tr key={team._id?.toString()}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-lg font-bold">#{index + 1}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-medium">{team.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{team.owner}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`font-medium ${team.pointsLeft > 5000 ? 'text-green-600' :
                                                        team.pointsLeft > 2000 ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                        PKR {team.pointsLeft.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {team.players?.length || 0}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
