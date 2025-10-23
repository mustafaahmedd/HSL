'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Select } from '@/components/ui';
import { IPlayer } from '@/types/Player';

const categories = [
    { value: 'Platinum', label: 'Platinum' },
    { value: 'Diamond', label: 'Diamond' },
    { value: 'Gold', label: 'Gold' },
    { value: 'Silver', label: 'Silver' },
    { value: 'Bronze', label: 'Bronze' },
];

const playerTypes = [
    { value: 'Batsman', label: 'Batsman' },
    { value: 'Bowler', label: 'Bowler' },
    { value: 'Batting All-Rounder', label: 'Batting All-Rounder' },
    { value: 'Bowling All-Rounder', label: 'Bowling All-Rounder' },
];

export default function PlayersManagement() {
    const router = useRouter();
    const [players, setPlayers] = useState<IPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [editingPlayer, setEditingPlayer] = useState<IPlayer | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        await fetchPlayers();
        setLoading(false);
    };

    const fetchPlayers = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch('/api/admin/players', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setPlayers(data.players);
            }
        } catch (error) {
            console.error('Failed to fetch players:', error);
        }
    };

    const handleEditPlayer = (player: IPlayer) => {
        setEditingPlayer({ ...player });
        setShowEditModal(true);
    };

    const handleSavePlayer = async () => {
        if (!editingPlayer) return;

        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch('/api/admin/players', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerId: editingPlayer._id,
                    updates: {
                        type: editingPlayer.type,
                        category: editingPlayer.category,
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                await fetchPlayers();
                setShowEditModal(false);
                setEditingPlayer(null);
            } else {
                alert(data.error || 'Failed to update player');
            }
        } catch (error) {
            console.error('Failed to update player:', error);
            alert('Failed to update player');
        }
    };

    const handleCreateFinalPlayer = async (player: IPlayer) => {
        if (!confirm(`Create final player for ${player.name}? This will add them to the auction pool.`)) {
            return;
        }

        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch('/api/admin/players', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    originalPlayerId: player._id,
                    finalData: {
                        type: player.type || player.selfAssignedCategory,
                        category: player.category || player.selfAssignedCategory,
                        status: 'available'
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(`Final player created for ${player.name}`);
                await fetchPlayers();
            } else {
                alert(data.error || 'Failed to create final player');
            }
        } catch (error) {
            console.error('Failed to create final player:', error);
            alert('Failed to create final player');
        }
    };

    const filteredPlayers = players.filter(player => {
        const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.contactNo.includes(searchTerm);
        const matchesCategory = !filterCategory || player.selfAssignedCategory === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryBadge = (category: string) => {
        const categoryClass = category.toLowerCase();
        return (
            <span className={`category-badge category-${categoryClass} status-badge`}>
                {category}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const statusClass = status || 'available';
        return (
            <span className={`status-badge status-${statusClass}`}>
                {statusClass.charAt(0).toUpperCase() + statusClass.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Players Management</h1>
                        <p className="text-gray-600 mt-2">Review and categorize registered players</p>
                    </div>
                    <div className="flex space-x-4">
                        <Link href="/admin">
                            <Button variant="secondary">Back to Dashboard</Button>
                        </Link>
                        <Link href="/admin/auction">
                            <Button variant="primary">Auction Control</Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Search Players"
                            placeholder="Search by name or contact..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Select
                            label="Filter by Category"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            options={[
                                { value: '', label: 'All Categories' },
                                ...categories
                            ]}
                        />
                        <div className="flex items-end">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterCategory('');
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Players Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Player
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student Info
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Self Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Admin Override
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
                                {filteredPlayers.map((player) => (
                                    <tr key={player._id?.toString()} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={player.photoUrl || '/placeholder.jpg'}
                                                        alt={player.name}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {player.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {player.skillLevel}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {player.contactNo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {player.isHikmahStudent ? (
                                                <div>
                                                    <div className="text-green-600 font-medium">Hikmah Student</div>
                                                    {player.courseEnrolled && (
                                                        <div className="text-xs">{player.courseEnrolled}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">External</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getCategoryBadge(player.selfAssignedCategory)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                {player.type && (
                                                    <div className="text-xs text-blue-600">{player.type}</div>
                                                )}
                                                {player.category && (
                                                    <div>{getCategoryBadge(player.category)}</div>
                                                )}
                                                {!player.type && !player.category && (
                                                    <span className="text-xs text-gray-400">Not reviewed</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(player.status || 'available')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <Link href={`/admin/players/${player._id}`}>
                                                <Button variant="secondary" size="sm">
                                                    View Details
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleEditPlayer(player)}
                                            >
                                                Quick Edit
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleCreateFinalPlayer(player)}
                                                disabled={!player.type || !player.category}
                                            >
                                                Create Final
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredPlayers.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No players found matching your criteria.</p>
                        </div>
                    )}
                </Card>

                {/* Edit Modal */}
                {showEditModal && editingPlayer && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                            <h3 className="text-lg font-semibold mb-4">Edit Player Details</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Player Type
                                    </label>
                                    <Select
                                        value={editingPlayer.type || ''}
                                        onChange={(e) => setEditingPlayer({
                                            ...editingPlayer,
                                            type: e.target.value
                                        })}
                                        options={[
                                            { value: '', label: 'Select Type' },
                                            ...playerTypes
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Final Category
                                    </label>
                                    <Select
                                        value={editingPlayer.category || ''}
                                        onChange={(e) => setEditingPlayer({
                                            ...editingPlayer,
                                            category: e.target.value
                                        })}
                                        options={[
                                            { value: '', label: 'Select Category' },
                                            ...categories
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingPlayer(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSavePlayer}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
