'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Select, NumberInput } from '@/components/ui';
import { IAuction, IBid, IAuctionSession } from '@/types/Auction';
import { IPlayer } from '@/types/Player';
import { ITeam } from '@/types/Team';
import { IRegistration } from '@/types/Registration';

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
    const [eventRegistrations, setEventRegistrations] = useState<IRegistration[]>([]);
    const [availableTeams, setAvailableTeams] = useState<ITeam[]>([]);

    // Forms state
    const [showPlayerSelection, setShowPlayerSelection] = useState(false);
    const [showTeamSelection, setShowTeamSelection] = useState(false);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<string[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

    // Live auction state
    const [currentPlayer, setCurrentPlayer] = useState<IRegistration | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentBid, setCurrentBid] = useState<IBid | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [categoryLocked, setCategoryLocked] = useState(false);
    const [queuedPlayers, setQueuedPlayers] = useState<IPlayer[]>([]);

    // Moderator edit state
    const [showModeratorEdit, setShowModeratorEdit] = useState(false);
    const [moderatorTeamId, setModeratorTeamId] = useState('');
    const [moderatorBidPrice, setModeratorBidPrice] = useState(0);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated && auctionId) {
            fetchAuctionData();
        }
    }, [isAuthenticated, auctionId]);

    // Load registrations/teams once auction is known so eventId is available
    useEffect(() => {
        if (isAuthenticated && auction?.eventId) {
            fetchAvailableData();
        }
    }, [isAuthenticated, auction?.eventId]);

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
            // Fetch event registrations to display in selection UI
            if (auction?.eventId) {
                const regsResponse = await fetch(`/api/registrations?eventId=${(auction.eventId as any)?._id || auction.eventId}`, { headers });
                // console.log("Regs Response: ", regsResponse);
                const regsData = await regsResponse.json();
                if (regsData.success) {
                    // Filter out registrations that are already added to the auction
                    // AND only show approved registrations (status === 'approved')
                    const alreadyAddedIds = auction?.players?.map((p: any) => p._id?.toString()) || [];
                    const availableRegs = regsData.registrations.filter(
                        (reg: IRegistration) =>
                            !alreadyAddedIds.includes(reg._id?.toString())
                        // reg.status === 'approved'
                    );
                    setEventRegistrations(availableRegs);
                }
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
        if (selectedRegistrationIds.length === 0) {
            alert('Please select at least one registrant.');
            return;
        }

        await handleAuctionAction('add_players', { registrationIds: selectedRegistrationIds });
        setShowPlayerSelection(false);
        setSelectedPlayers([]);
        setSelectedRegistrationIds([]);
        // Refresh available data to update the filtered list
        await fetchAuctionData();
    };

    const fetchCategoryQueue = async (category: string) => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`/api/auction/queue?category=${encodeURIComponent(category)}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            console.log("Queue Data: ", data);
            if (data.success) {
                setQueuedPlayers(data.players);

                // If no players returned, show an alert
                if (data.players.length === 0) {
                    alert(`No available players found in ${category} category. All players may be sold or not approved.`);
                }
            }
        } catch (e) {
            console.error('Failed to fetch queue:', e);
            alert('Failed to fetch player queue. Please try again.');
        }
    };

    const handleNextRandomizedPlayer = async () => {
        if (!selectedCategory) return;
        if (queuedPlayers.length === 0) {
            await fetchCategoryQueue(selectedCategory);
        }
        const next = queuedPlayers[0];
        if (next) {
            await handleStartBidding(next._id!.toString());
            setQueuedPlayers(prev => prev.slice(1));
        }
    };

    const handleAddTeams = async () => {
        await handleAuctionAction('add_teams', { teamIds: selectedTeams });
        setShowTeamSelection(false);
        setSelectedTeams([]);
    };

    const handleStartBidding = async (registrationId: string) => {
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
                    data: { registrationId }
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

    const handleManualAssignment = async () => {
        if (!currentPlayer || !moderatorTeamId || moderatorBidPrice < 0) {
            alert('Please select a team and enter a valid bid price');
            return;
        }

        const token = localStorage.getItem('adminToken');

        try {
            const response = await fetch(`/api/auction/${auctionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'manual_assign',
                    data: {
                        registrationId: currentPlayer._id?.toString(),
                        teamId: moderatorTeamId,
                        bidPrice: moderatorBidPrice
                    }
                }),
            });

            const result = await response.json();

            if (result.success) {
                setShowModeratorEdit(false);
                setModeratorTeamId('');
                setModeratorBidPrice(0);
                fetchAuctionData();
            } else {
                alert(result.error || 'Failed to assign player');
            }
        } catch (error) {
            console.error('Failed to manually assign player:', error);
            alert('Failed to assign player');
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
                        <p className="text-gray-600">{(auction.eventId as any)?.title}</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${auction.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            auction.status === 'live' ? 'bg-green-100 text-green-800' :
                                auction.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                            }`}>
                            {auction.status.toUpperCase()}
                        </span>

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
                {/* <Card title="Auction Status" className="mb-8">
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
                                    variant="secondary"
                                    onClick={() => handleAuctionAction('assign_icon_players')}
                                >
                                    Assign Icon Captains
                                </Button>
                            )}
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
                </Card> */}

                {/* Live Auction Interface */}
                {auction.status === 'live' && session?.isActive && (
                    <Card title="Live Auction" className="mb-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Current Player</h3>
                                {currentPlayer ? (
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200 shadow-md">
                                        <div className="flex items-center gap-4 mb-4">
                                            <img
                                                src={currentPlayer.photoUrl || '/placeholder-avatar.png'}
                                                alt={currentPlayer.name}
                                                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="text-2xl font-bold text-gray-900">{currentPlayer.name}</h4>
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${(currentPlayer.approvedCategory || currentPlayer.selfAssignedCategory) === 'Platinum' ? 'bg-purple-200 text-purple-900' :
                                                        (currentPlayer.approvedCategory || currentPlayer.selfAssignedCategory) === 'Diamond' ? 'bg-blue-200 text-blue-900' :
                                                            (currentPlayer.approvedCategory || currentPlayer.selfAssignedCategory) === 'Gold' ? 'bg-yellow-200 text-yellow-900' :
                                                                'bg-gray-200 text-gray-900'
                                                        }`}>
                                                        {currentPlayer.approvedCategory || currentPlayer.selfAssignedCategory}
                                                    </span>
                                                </div>
                                                {(currentPlayer.approvedIconPlayer || currentPlayer.iconPlayerRequest) && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded bg-orange-200 text-orange-800">
                                                        CAPTAIN
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2 bg-white bg-opacity-60 p-4 rounded">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">Type:</span>
                                                <span className="text-sm font-semibold text-gray-900">{currentPlayer.playerRole || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">Skill Level:</span>
                                                <span className="text-sm font-semibold text-gray-900">{currentPlayer.skillLevel || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">Contact:</span>
                                                <span className="text-sm font-semibold text-gray-900">{currentPlayer.contactNo}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2 mt-2">
                                                <span className="text-sm font-medium text-gray-600">Base Price:</span>
                                                <span className="text-sm font-bold text-green-700">PKR {(auction.basePrice || 500).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">Increment:</span>
                                                <span className="text-sm font-bold text-blue-700">PKR {(auction.biddingIncrement || 100).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border">
                                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <p>No player currently being auctioned</p>
                                    </div>
                                )}
                            </div>

                            {/* <div>
                                <h3 className="text-lg font-semibold mb-4">Bidding Status</h3>
                                <div className="bg-white p-6 rounded-lg border shadow-sm">
                                    {currentBid ? (
                                        <div>
                                            <div className="bg-green-50 p-4 rounded-lg mb-4">
                                                <div className="text-sm text-gray-600 mb-1">Current Highest Bid:</div>
                                                <div className="text-3xl font-bold text-green-600">
                                                    PKR {currentBid.amount.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="space-y-3 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">Team:</span>
                                                    <span className="text-sm font-semibold text-gray-900">{currentBid.bidderInfo.teamName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">Owner:</span>
                                                    <span className="text-sm font-semibold text-gray-900">{currentBid.bidderInfo.ownerName}</span>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded flex justify-between items-center mb-4">
                                                <span className="text-sm font-medium text-gray-600">Time Remaining:</span>
                                                <span className={`text-2xl font-bold ${timeRemaining < 30 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {formatTime(timeRemaining)}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    variant="primary"
                                                    className="w-full"
                                                    onClick={handleFinalizeBid}
                                                    disabled={timeRemaining > 0}
                                                >
                                                    Finalize Bid
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className="w-full"
                                                    onClick={() => handleAuctionAction('next_player')}
                                                >
                                                    Next Player
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-center py-8 text-gray-500 mb-4">
                                                No bids yet for this player
                                            </div>
                                            {currentPlayer && (
                                                <Button
                                                    variant="primary"
                                                    className="w-full text-gray-900"
                                                    onClick={() => setShowModeratorEdit(true)}
                                                >
                                                    Manual Assignment
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div> */}
                        </div>
                    </Card>
                )}

                {/* Moderator Manual Assignment Modal */}
                {showModeratorEdit && currentPlayer && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                            <h3 className="text-xl font-bold mb-4 text-gray-900">Manual Assignment</h3>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Player: <span className="font-bold text-gray-900">{currentPlayer.name}</span>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Team
                                    </label>
                                    <Select
                                        value={moderatorTeamId}
                                        onChange={(e) => setModeratorTeamId(e.target.value)}
                                        options={[
                                            { value: '', label: 'Select a team' },
                                            ...auction.teams.map((team: any) => ({
                                                value: team._id.toString(),
                                                label: `${team.title} (${team.owner})`
                                            }))
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Final Bid Price (PKR)
                                    </label>
                                    <NumberInput
                                        value={moderatorBidPrice}
                                        onChange={(e: any) => setModeratorBidPrice(Number(e.target.value))}
                                        placeholder="Enter bid price"
                                        className="text-gray-900"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    onClick={handleManualAssignment}
                                >
                                    Assign Player
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowModeratorEdit(false);
                                        setModeratorTeamId('');
                                        setModeratorBidPrice(0);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {auction.status === 'live' && (
                    <Card title="Category Moderation" className="mb-8">
                        <div className="flex flex-col gap-6">
                            {/* Category Selection Header */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-lg mb-2 text-gray-900">Select Auction Category</h4>
                                        <p className="text-sm text-gray-600">Categories proceed in order: Platinum → Diamond → Gold</p>
                                    </div>
                                    {categoryLocked && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                            Category Locked
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Category
                                    </label>
                                    <Select
                                        value={selectedCategory}
                                        onChange={(e) => {
                                            if (!categoryLocked) {
                                                setSelectedCategory(e.target.value);
                                            }
                                        }}
                                        disabled={categoryLocked}
                                        options={[
                                            {
                                                value: 'Platinum',
                                                label: `Platinum (${auction.players.filter((r: any) => (r.approvedCategory || r.selfAssignedCategory) === 'Platinum').length} available)`
                                            },
                                            {
                                                value: 'Diamond',
                                                label: `Diamond (${auction.players.filter((r: any) => (r.approvedCategory || r.selfAssignedCategory) === 'Diamond').length} available)`
                                            },
                                            {
                                                value: 'Gold',
                                                label: `Gold (${auction.players.filter((r: any) => (r.approvedCategory || r.selfAssignedCategory) === 'Gold').length} available)`
                                            },
                                        ]}
                                    />
                                </div>
                                <div className="flex flex-col gap-2 justify-end">
                                    {!categoryLocked && selectedCategory && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                if (selectedCategory) {
                                                    fetchCategoryQueue(selectedCategory);
                                                    setCategoryLocked(true);
                                                }
                                            }}
                                            className="w-full"
                                        >
                                            Lock & Load Category
                                        </Button>
                                    )}
                                    {categoryLocked && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                const availableCount = auction.players.filter((p: any) => (p.selfAssignedCategory || p.category) === selectedCategory && p.status === 'available').length;
                                                if (availableCount === 0 || confirm('Are you sure you want to unlock and change category?')) {
                                                    setCategoryLocked(false);
                                                    setQueuedPlayers([]);
                                                }
                                            }}
                                            className="w-full"
                                        >
                                            Unlock Category
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {selectedCategory && categoryLocked && (
                                <>
                                    <div className="bg-white p-4 rounded-lg border">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h5 className="font-semibold text-gray-900">{selectedCategory} Category</h5>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {auction.players.filter((p: any) =>
                                                        (p.approvedCategory || p.selfAssignedCategory) === selectedCategory &&
                                                        p.status === 'approved' &&
                                                        !p.teamId
                                                    ).length} players available
                                                </p>
                                            </div>
                                            <Button
                                                variant="primary"
                                                onClick={handleNextRandomizedPlayer}
                                                disabled={!selectedCategory || auction.players.filter((p: any) =>
                                                    (p.approvedCategory || p.selfAssignedCategory) === selectedCategory &&
                                                    p.status === 'approved' &&
                                                    !p.teamId
                                                ).length === 0}
                                                className="px-6"
                                            >
                                                Next Random Player
                                            </Button>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Progress:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {auction.players.filter((p: any) => (p.approvedCategory || p.selfAssignedCategory) === selectedCategory && p.teamId).length} sold / {auction.players.filter((p: any) => (p.approvedCategory || p.selfAssignedCategory) === selectedCategory).length} total
                                                </span>
                                            </div>
                                            <div className="mt-2 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-blue-600 h-full transition-all"
                                                    style={{
                                                        width: `${(auction.players.filter((p: any) => (p.approvedCategory || p.selfAssignedCategory) === selectedCategory && p.teamId).length / Math.max(1, auction.players.filter((p: any) => (p.approvedCategory || p.selfAssignedCategory) === selectedCategory).length)) * 100}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <h5 className="font-semibold mb-3">Available Players in {selectedCategory}</h5>
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {auction.players
                                                    .filter((p: any) => (p.approvedCategory || p.selfAssignedCategory) === selectedCategory)
                                                    .map((p: any) => (
                                                        <tr key={p._id?.toString()} className={p.teamId ? 'bg-gray-50 opacity-60' : ''}>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{p.playerRole || '-'}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{p.skillLevel || '-'}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${p.teamId ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                                    {p.teamId ? 'sold' : 'available'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
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
                            <div className="text-3xl font-bold text-purple-600">PKR {stats.totalRevenue}</div>
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
                        <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold text-lg text-gray-900">Select Players to Add</h4>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4"
                                        checked={selectedRegistrationIds.length === eventRegistrations.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedRegistrationIds(eventRegistrations.map(r => r._id!.toString()));
                                            } else {
                                                setSelectedRegistrationIds([]);
                                            }
                                        }}
                                    />
                                    <span className="font-medium text-sm text-blue-600">Select All ({eventRegistrations.length})</span>
                                </label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
                                {eventRegistrations.map((reg) => (
                                    <label key={reg._id?.toString()} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            className="mt-1 w-4 h-4"
                                            checked={selectedRegistrationIds.includes(reg._id!.toString())}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedRegistrationIds([...selectedRegistrationIds, reg._id!.toString()]);
                                                } else {
                                                    setSelectedRegistrationIds(selectedRegistrationIds.filter(id => id !== reg._id!.toString()));
                                                }
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">{reg.name}</div>
                                            <div className="text-xs text-gray-600 mt-1">{reg.playingStyle}</div>
                                            <div className="text-xs text-gray-600 mt-1">{reg.contactNo}</div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${(reg.approvedCategory || reg.selfAssignedCategory) === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                                                    (reg.approvedCategory || reg.selfAssignedCategory) === 'Diamond' ? 'bg-blue-100 text-blue-700' :
                                                        (reg.approvedCategory || reg.selfAssignedCategory) === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {reg.approvedCategory || reg.selfAssignedCategory || 'Uncategorized'}
                                                </span>
                                                {(reg.approvedIconPlayer || reg.iconPlayerRequest) ? (
                                                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">
                                                        Captain
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-teal-400 text-gray-100">
                                                        Player
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                <Button onClick={handleAddPlayers} disabled={selectedRegistrationIds.length === 0}>
                                    Add {selectedRegistrationIds.length} Selected
                                </Button>
                                <Button variant="secondary" onClick={() => {
                                    setShowPlayerSelection(false);
                                    setSelectedRegistrationIds([]);
                                }}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Player
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Skill Level
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
                                    <tr key={player._id?.toString()} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={player.photoUrl || '/placeholder-avatar.png'}
                                                        alt={player.name}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{player.name}</div>
                                                    {(player.approvedIconPlayer || player.iconPlayerRequest) && (
                                                        <span className="text-xs text-orange-600 font-medium">Captain</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{player.contactNo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.playerRole}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${(player.approvedCategory || player.selfAssignedCategory || player.category) === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                                                (player.approvedCategory || player.selfAssignedCategory || player.category) === 'Diamond' ? 'bg-blue-100 text-blue-800' :
                                                    (player.approvedCategory || player.selfAssignedCategory || player.category) === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {player.approvedCategory || player.selfAssignedCategory || player.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{player.skillLevel || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${player.teamId ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {player.teamId ? 'sold' : 'available'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {auction.status === 'live' && !player.teamId && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleStartBidding(player._id.toString())}
                                                >
                                                    Start Bidding
                                                </Button>
                                            )}
                                            {player.teamId && player.bidPrice && (
                                                <span className="text-green-600 font-medium">PKR {player.bidPrice.toLocaleString()}</span>
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
                        <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <h4 className="font-semibold text-lg mb-4 text-gray-900">Select Teams to Add</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
                                {availableTeams.map((team) => (
                                    <label key={team._id?.toString()} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4"
                                            checked={selectedTeams.includes(team._id!.toString())}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTeams([...selectedTeams, team._id!.toString()]);
                                                } else {
                                                    setSelectedTeams(selectedTeams.filter(id => id !== team._id!.toString()));
                                                }
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900">{team.title}</div>
                                            <div className="text-sm text-gray-600 mt-1">Owner: {team.owner}</div>
                                            <div className="text-sm font-medium text-green-600 mt-1">Budget: PKR {team.totalPoints?.toLocaleString()}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                <Button onClick={handleAddTeams} disabled={selectedTeams.length === 0}>
                                    Add Selected Teams
                                </Button>
                                <Button variant="secondary" onClick={() => setShowTeamSelection(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {auction.teams.map((team: any) => (
                            <div key={team._id?.toString()} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                                    <h3 className="text-white font-semibold text-lg text-gray-900">{team.title}</h3>
                                    <p className="text-blue-100 text-sm mt-0.5"><strong>Owner: {team.owner}</strong></p>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Total Points</span>
                                        <span className="text-sm font-semibold text-gray-900">PKR {team.totalPoints?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Spent</span>
                                        <span className="text-sm font-semibold text-red-600">PKR {team.pointsSpent?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Remaining</span>
                                        <span className="text-sm font-semibold text-green-600">PKR {team.pointsLeft?.toLocaleString() || team.totalPoints?.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Players</span>
                                            <span className="text-xs font-medium text-blue-600">{(team.players || []).length} / {team.maxPlayers}</span>
                                        </div>
                                        <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-full transition-all"
                                                style={{ width: `${Math.min(100, ((team.pointsSpent || 0) / (team.totalPoints || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
