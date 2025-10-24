'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Select } from '@/components/ui';
import { IAuction, IBid, IAuctionSession } from '@/types/Auction';
import { IPlayer } from '@/types/Player';
import { ITeam } from '@/types/Team';

export default function AuctionManagement() {
    const router = useRouter();
    const params = useParams();
    const auctionId = params.id as string;

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Auction data
    const [auction, setAuction] = useState<IAuction | null>(null);
    const [session, setSession] = useState<IAuctionSession | null>(null);
    const [bids, setBids] = useState<IBid[]>([]);
    const [stats, setStats] = useState<any>(null);

    // Available data for selection
    const [availablePlayers, setAvailablePlayers] = useState<IPlayer[]>([]);
    const [availableTeams, setAvailableTeams] = useState<ITeam[]>([]);

    // Forms state
    const [showPlayerSelection, setShowPlayerSelection] = useState(false);
    const [showTeamSelection, setShowTeamSelection] = useState(false);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

    // Live auction state
    const [currentPlayer, setCurrentPlayer] = useState<IPlayer | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentBid, setCurrentBid] = useState<IBid | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated && auctionId) {
            fetchAuctionData();
            fetchAvailableData();
        }
    }, [isAuthenticated, auctionId]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (session?.isActive && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [session?.isActive, timeRemaining]);

    const checkAuth = () => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            setIsAuthenticated(true);
        }
        setLoading(false);
    };

    const fetchAuctionData = async () => {
        const token = localStorage.getItem('adminToken');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const response = await fetch(`/api/auction/${auctionId}`, { headers });
            const data = await response.json();

            if (data.success) {
                setAuction(data.auction);
                setSession(data.session);
                setBids(data.bids);
                setStats(data.stats);

                if (data.session?.currentPlayerId) {
                    setCurrentPlayer(data.session.currentPlayerId);
                }
                if (data.session?.currentHighestBid) {
                    setCurrentBid(data.session.currentHighestBid);
                }
                if (data.session?.biddingEndTime) {
                    const now = new Date();
                    const endTime = new Date(data.session.biddingEndTime);
                    setTimeRemaining(Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000)));
                }
            }
        } catch (error) {
            console.error('Failed to fetch auction data:', error);
        }
    };

    const fetchAvailableData = async () => {
        const token = localStorage.getItem('adminToken');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // Fetch all players
            const playersResponse = await fetch('/api/register', { headers });
            const playersData = await playersResponse.json();
            if (playersData.success) {
                setAvailablePlayers(playersData.players);
            }

            // Fetch all teams
            const teamsResponse = await fetch('/api/admin/config', { headers });
            const teamsData = await teamsResponse.json();
            if (teamsData.success) {
                setAvailableTeams(teamsData.teams);
            }
        } catch (error) {
            console.error('Failed to fetch available data:', error);
        }
    };

    const handleAuctionAction = async (action: string, data: any = {}) => {
        const token = localStorage.getItem('adminToken');

        try {
            const response = await fetch(`/api/auction/${auctionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ action, data }),
            });

            const result = await response.json();

            if (result.success) {
                fetchAuctionData();
            } else {
                console.error('Failed to update auction:', result.error);
            }
        } catch (error) {
            console.error('Failed to update auction:', error);
        }
    };

    const handleAddPlayers = async () => {
        await handleAuctionAction('add_players', { playerIds: selectedPlayers });
        setShowPlayerSelection(false);
        setSelectedPlayers([]);
    };

    const handleAddTeams = async () => {
        await handleAuctionAction('add_teams', { teamIds: selectedTeams });
        setShowTeamSelection(false);
        setSelectedTeams([]);
    };

    const handleStartBidding = async (playerId: string) => {
        const token = localStorage.getItem('adminToken');

        try {
            const response = await fetch(`/api/auction/${auctionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'start_bidding',
                    data: { playerId }
                }),
            });

            const result = await response.json();

            if (result.success) {
                fetchAuctionData();
            }
        } catch (error) {
            console.error('Failed to start bidding:', error);
        }
    };

    const handleFinalizeBid = async () => {
        if (!currentBid) return;

        const token = localStorage.getItem('adminToken');

        try {
            const response = await fetch(`/api/auction/${auctionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'finalize_bid',
                    data: { bidId: currentBid._id }
                }),
            });

            const result = await response.json();

            if (result.success) {
                fetchAuctionData();
            }
        } catch (error) {
            console.error('Failed to finalize bid:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        router.push('/admin/auction');
        return null;
    }

    if (!auction) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Auction Not Found</h2>
                    <Link href="/admin/auction">
                        <Button variant="primary">Back to Auctions</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{auction.name}</h1>
                        <p className="text-gray-600">{(auction.eventId as any)?.name}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <Link href="/admin/auction">
                            <Button variant="secondary" className="w-full sm:w-auto">Back to Auctions</Button>
                        </Link>
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto"
                            onClick={() => {
                                localStorage.removeItem('adminToken');
                                setIsAuthenticated(false);
                            }}
                        >
                            Logout
                        </Button>
                    </div>
                </div>

                {/* Auction Status and Controls */}
                <Card title="Auction Status" className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${auction.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                auction.status === 'live' ? 'bg-green-100 text-green-800' :
                                    auction.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                        'bg-red-100 text-red-800'
                                }`}>
                                {auction.status.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-600">
                                {new Date(auction.auctionDate).toLocaleDateString()} {new Date(auction.auctionDate).toLocaleTimeString()}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {auction.status === 'upcoming' && (
                                <Button
                                    variant="primary"
                                    onClick={() => handleAuctionAction('start_auction')}
                                >
                                    Start Auction
                                </Button>
                            )}
                            {auction.status === 'live' && (
                                <Button
                                    variant="secondary"
                                    onClick={() => handleAuctionAction('end_auction')}
                                >
                                    End Auction
                                </Button>
                            )}
                            {auction.status === 'live' && (
                                <Button
                                    variant="secondary"
                                    onClick={() => handleAuctionAction('cancel_auction')}
                                >
                                    Cancel Auction
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Live Auction Interface */}
                {auction.status === 'live' && session?.isActive && (
                    <Card title="Live Auction" className="mb-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Current Player</h3>
                                {currentPlayer ? (
                                    <div className="bg-white p-4 rounded-lg border">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-xl font-bold">{currentPlayer.name}</h4>
                                            <span className={`px-2 py-1 text-xs rounded-full ${currentPlayer.category === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                                                currentPlayer.category === 'Diamond' ? 'bg-blue-100 text-blue-800' :
                                                    currentPlayer.category === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {currentPlayer.category}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-2">{currentPlayer.type}</p>
                                        <p className="text-sm text-gray-500">Contact: {currentPlayer.contactNo}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No player currently being auctioned
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4">Bidding Status</h3>
                                <div className="bg-white p-4 rounded-lg border">
                                    {currentBid ? (
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm text-gray-600">Current Highest Bid:</span>
                                                <span className="text-xl font-bold text-green-600">
                                                    PKR {currentBid.amount.toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">
                                                By: {currentBid.bidderInfo.teamName} ({currentBid.bidderInfo.ownerName})
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Time Remaining:</span>
                                                <span className={`text-lg font-bold ${timeRemaining < 30 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {formatTime(timeRemaining)}
                                                </span>
                                            </div>
                                            <div className="mt-4 flex gap-2">
                                                <Button
                                                    variant="primary"
                                                    onClick={handleFinalizeBid}
                                                    disabled={timeRemaining > 0}
                                                >
                                                    Finalize Bid
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleAuctionAction('next_player')}
                                                >
                                                    Next Player
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-500">
                                            No bids yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card className="text-center">
                            <div className="text-3xl font-bold text-blue-600">{stats.totalPlayers}</div>
                            <div className="text-sm text-gray-600">Total Players</div>
                        </Card>
                        <Card className="text-center">
                            <div className="text-3xl font-bold text-green-600">{stats.playersSold}</div>
                            <div className="text-sm text-gray-600">Players Sold</div>
                        </Card>
                        <Card className="text-center">
                            <div className="text-3xl font-bold text-yellow-600">{stats.playersAvailable}</div>
                            <div className="text-sm text-gray-600">Available</div>
                        </Card>
                        <Card className="text-center">
                            <div className="text-3xl font-bold text-purple-600">PKR {stats.totalRevenue.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">Total Revenue</div>
                        </Card>
                    </div>
                )}

                {/* Player Management */}
                <Card title="Player Management" className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <span className="text-sm text-gray-600">
                                {auction.players.length} players selected
                            </span>
                        </div>
                        <Button onClick={() => setShowPlayerSelection(true)}>
                            Add Players
                        </Button>
                    </div>

                    {showPlayerSelection && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold mb-4">Select Players to Add</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                                {availablePlayers.map((player) => (
                                    <label key={player._id?.toString()} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={selectedPlayers.includes(player._id!.toString())}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedPlayers([...selectedPlayers, player._id!.toString()]);
                                                } else {
                                                    setSelectedPlayers(selectedPlayers.filter(id => id !== player._id!.toString()));
                                                }
                                            }}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{player.name}</div>
                                            <div className="text-sm text-gray-600">{player.type} - {player.category}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button onClick={handleAddPlayers} disabled={selectedPlayers.length === 0}>
                                    Add Selected Players
                                </Button>
                                <Button variant="secondary" onClick={() => setShowPlayerSelection(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {auction.players.map((player: any) => (
                                    <tr key={player._id?.toString()}>
                                        <td className="px-6 py-4 whitespace-nowrap">{player.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{player.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${player.category === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                                                player.category === 'Diamond' ? 'bg-blue-100 text-blue-800' :
                                                    player.category === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {player.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${player.status === 'sold' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {player.status || 'available'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {auction.status === 'live' && player.status === 'available' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleStartBidding(player._id.toString())}
                                                >
                                                    Start Bidding
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Team Management */}
                <Card title="Team Management">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <span className="text-sm text-gray-600">
                                {auction.teams.length} teams registered
                            </span>
                        </div>
                        <Button onClick={() => setShowTeamSelection(true)}>
                            Add Teams
                        </Button>
                    </div>

                    {showTeamSelection && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold mb-4">Select Teams to Add</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                                {availableTeams.map((team) => (
                                    <label key={team._id?.toString()} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={selectedTeams.includes(team._id!.toString())}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTeams([...selectedTeams, team._id!.toString()]);
                                                } else {
                                                    setSelectedTeams(selectedTeams.filter(id => id !== team._id!.toString()));
                                                }
                                            }}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{team.name}</div>
                                            <div className="text-sm text-gray-600">Owner: {team.owner}</div>
                                            <div className="text-sm text-gray-600">Budget: PKR {team.totalBudget.toLocaleString()}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button onClick={handleAddTeams} disabled={selectedTeams.length === 0}>
                                    Add Selected Teams
                                </Button>
                                <Button variant="secondary" onClick={() => setShowTeamSelection(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Team Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Owner
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Budget
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Spent
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Remaining
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {auction.teams.map((team: any) => (
                                    <tr key={team._id?.toString()}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{team.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{team.owner}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">PKR {team.totalBudget.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">PKR {team.pointsSpent.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">PKR {team.pointsLeft.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
