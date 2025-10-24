'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Select } from '@/components/ui';
import { IAuction } from '@/types/Auction';
import { ITeam } from '@/types/Team';

export default function TeamRegistration() {
    const router = useRouter();
    const params = useParams();
    const auctionId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [auction, setAuction] = useState<IAuction | null>(null);
    const [existingTeams, setExistingTeams] = useState<ITeam[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showJoinForm, setShowJoinForm] = useState(false);

    // Team creation form
    const [teamForm, setTeamForm] = useState({
        name: '',
        owner: '',
        totalBudget: 8000,
    });

    // Team joining form
    const [selectedTeam, setSelectedTeam] = useState('');

    useEffect(() => {
        if (auctionId) {
            fetchAuctionData();
        }
    }, [auctionId]);

    const fetchAuctionData = async () => {
        try {
            const response = await fetch(`/api/auction/${auctionId}`);
            const data = await response.json();

            if (data.success) {
                setAuction(data.auction);
                setExistingTeams(data.auction.teams || []);
            }
        } catch (error) {
            console.error('Failed to fetch auction data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/admin/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'team',
                    data: teamForm,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Add team to auction
                const addTeamResponse = await fetch(`/api/auction/${auctionId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'add_teams',
                        data: { teamIds: [data.team._id] },
                    }),
                });

                if (addTeamResponse.ok) {
                    setShowCreateForm(false);
                    setTeamForm({ name: '', owner: '', totalBudget: 8000 });
                    fetchAuctionData();
                    alert('Team created and registered successfully!');
                } else {
                    alert('Team created but failed to register for auction');
                }
            } else {
                alert(data.error || 'Failed to create team');
            }
        } catch (error) {
            console.error('Failed to create team:', error);
            alert('Failed to create team');
        }
    };

    const handleJoinTeam = async () => {
        if (!selectedTeam) {
            alert('Please select a team to join');
            return;
        }

        try {
            const response = await fetch(`/api/auction/${auctionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'add_teams',
                    data: { teamIds: [selectedTeam] },
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowJoinForm(false);
                setSelectedTeam('');
                fetchAuctionData();
                alert('Team registered for auction successfully!');
            } else {
                alert(data.error || 'Failed to register team');
            }
        } catch (error) {
            console.error('Failed to register team:', error);
            alert('Failed to register team');
        }
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team Registration</h1>
                        <p className="text-gray-600">{auction.name}</p>
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

                {/* Auction Information */}
                <Card title="Auction Information" className="mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">Event Details</h3>
                            <p className="text-gray-600 mb-1">Event: {(auction.eventId as any)?.name}</p>
                            <p className="text-gray-600 mb-1">Auction Date: {new Date(auction.auctionDate).toLocaleDateString()}</p>
                            <p className="text-gray-600 mb-1">Auction Time: {new Date(auction.auctionDate).toLocaleTimeString()}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Auction Settings</h3>
                            <p className="text-gray-600 mb-1">Base Price: PKR {auction.basePrice.toLocaleString()}</p>
                            <p className="text-gray-600 mb-1">Bidding Increment: PKR {auction.biddingIncrement.toLocaleString()}</p>
                            <p className="text-gray-600 mb-1">Time per Player: {Math.floor(auction.timeLimitPerPlayer / 60)} minutes</p>
                        </div>
                    </div>

                    {auction.description && (
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-gray-600">{auction.description}</p>
                        </div>
                    )}
                </Card>

                {/* Registration Options */}
                {auction.status === 'upcoming' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Create New Team */}
                        <Card title="Create New Team">
                            <div className="space-y-4">
                                <p className="text-gray-600">
                                    Create a new team and register it for this auction. You'll be the team owner and can manage your budget.
                                </p>
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={() => setShowCreateForm(true)}
                                >
                                    Create New Team
                                </Button>
                            </div>

                            {showCreateForm && (
                                <form onSubmit={handleCreateTeam} className="mt-6 p-4 bg-gray-50 rounded-lg space-y-4">
                                    <Input
                                        label="Team Name"
                                        value={teamForm.name}
                                        onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                                        placeholder="Enter team name"
                                        required
                                    />
                                    <Input
                                        label="Owner Name"
                                        value={teamForm.owner}
                                        onChange={(e) => setTeamForm({ ...teamForm, owner: e.target.value })}
                                        placeholder="Enter your name"
                                        required
                                    />
                                    <Input
                                        label="Total Budget (PKR)"
                                        type="number"
                                        value={teamForm.totalBudget}
                                        onChange={(e) => setTeamForm({ ...teamForm, totalBudget: parseInt(e.target.value) })}
                                        min="1000"
                                        max="50000"
                                        required
                                    />
                                    <div className="flex gap-2">
                                        <Button type="submit" variant="primary" className="flex-1">
                                            Create & Register
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setShowCreateForm(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </Card>

                        {/* Join Existing Team */}
                        <Card title="Join Existing Team">
                            <div className="space-y-4">
                                <p className="text-gray-600">
                                    Join an existing team that's already registered for this auction.
                                </p>
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => setShowJoinForm(true)}
                                >
                                    Join Existing Team
                                </Button>
                            </div>

                            {showJoinForm && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-4">
                                    <Select
                                        label="Select Team to Join"
                                        value={selectedTeam}
                                        onChange={(e) => setSelectedTeam(e.target.value)}
                                        options={[
                                            { value: '', label: 'Choose a team...' },
                                            ...existingTeams.map(team => ({
                                                value: team._id?.toString() || '',
                                                label: `${team.name} (${team.owner})`
                                            }))
                                        ]}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleJoinTeam}
                                            variant="primary"
                                            className="flex-1"
                                            disabled={!selectedTeam}
                                        >
                                            Join Team
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => setShowJoinForm(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                ) : (
                    <Card title="Registration Status" className="mb-8">
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">
                                {auction.status === 'live' ? '🔴' :
                                    auction.status === 'completed' ? '✅' : '❌'}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                {auction.status === 'live' ? 'Auction is Live' :
                                    auction.status === 'completed' ? 'Auction Completed' : 'Auction Cancelled'}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {auction.status === 'live' ? 'Team registration is closed. The auction is currently in progress.' :
                                    auction.status === 'completed' ? 'This auction has finished. Thank you for participating!' :
                                        'This auction has been cancelled. Please contact the organizer for more information.'}
                            </p>
                            {auction.status === 'live' && (
                                <Link href={`/auction/${auctionId}/live`}>
                                    <Button variant="primary">View Live Auction</Button>
                                </Link>
                            )}
                        </div>
                    </Card>
                )}

                {/* Registered Teams */}
                <Card title="Registered Teams">
                    <div className="mb-4">
                        <span className="text-sm text-gray-600">
                            {existingTeams.length} teams registered
                        </span>
                    </div>

                    {existingTeams.length > 0 ? (
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
                                            Remaining
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Players
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {existingTeams.map((team) => (
                                        <tr key={team._id?.toString()}>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">{team.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{team.owner}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">PKR {team.totalBudget.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`font-medium ${team.pointsLeft > 5000 ? 'text-green-600' :
                                                    team.pointsLeft > 2000 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                    PKR {team.pointsLeft.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{team.players?.length || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-4">👥</div>
                            <p>No teams registered yet</p>
                            <p className="text-sm">Be the first to register your team!</p>
                        </div>
                    )}
                </Card>

                {/* Quick Actions */}
                {auction.status === 'upcoming' && (
                    <div className="mt-8 text-center">
                        <Link href={`/auction/${auctionId}/live`}>
                            <Button variant="secondary" className="mr-4">
                                Preview Auction Page
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="secondary">
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
