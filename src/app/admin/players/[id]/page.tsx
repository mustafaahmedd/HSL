'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
    { value: 'Batting All Rounder', label: 'Batting All Rounder' },
    { value: 'Bowling All Rounder', label: 'Bowling All Rounder' },
];

export default function PlayerDetail() {
    const router = useRouter();
    const params = useParams();
    const playerId = params.id as string;

    const [player, setPlayer] = useState<IPlayer | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<IPlayer>>({});

    useEffect(() => {
        checkAuth();
    }, [playerId]);

    const checkAuth = async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        await fetchPlayer();
        setLoading(false);
    };

    const fetchPlayer = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch('/api/admin/players', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                const foundPlayer = data.players.find((p: IPlayer) => p._id?.toString() === playerId);
                if (foundPlayer) {
                    setPlayer(foundPlayer);
                    setEditData({
                        type: foundPlayer.type,
                        category: foundPlayer.category,
                    });
                } else {
                    alert('Player not found');
                    router.push('/admin/players');
                }
            }
        } catch (error) {
            console.error('Failed to fetch player:', error);
        }
    };

    const handleSave = async () => {
        if (!player) return;

        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch('/api/admin/players', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerId: player._id,
                    updates: editData
                })
            });

            const data = await response.json();

            if (data.success) {
                setPlayer(data.player);
                setEditing(false);
                alert('Player updated successfully');
            } else {
                alert(data.error || 'Failed to update player');
            }
        } catch (error) {
            console.error('Failed to update player:', error);
            alert('Failed to update player');
        }
    };

    const handleCreateFinalPlayer = async () => {
        if (!player) return;

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
                        type: editData.type || player.selfAssignedCategory,
                        category: editData.category || player.selfAssignedCategory,
                        status: 'available'
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(`Final player created for ${player.name}`);
                await fetchPlayer();
            } else {
                alert(data.error || 'Failed to create final player');
            }
        } catch (error) {
            console.error('Failed to create final player:', error);
            alert('Failed to create final player');
        }
    };

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

    if (!player) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Player Not Found</h2>
                    <Link href="/admin/players">
                        <Button variant="primary">Back to Players</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{player.name}</h1>
                        <p className="text-gray-600 mt-2">Player Details & Management</p>
                    </div>
                    <div className="flex space-x-4">
                        <Link href="/admin/players">
                            <Button variant="secondary">Back to Players</Button>
                        </Link>
                        {editing ? (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setEditing(false);
                                        setEditData({
                                            type: player.type,
                                            category: player.category,
                                        });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSave}
                                >
                                    Save Changes
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={() => setEditing(true)}
                            >
                                Edit Player
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Player Photo & Basic Info */}
                    <div className="lg:col-span-1">
                        <Card>
                            <div className="text-center">
                                <img
                                    className="h-32 w-32 rounded-full object-cover mx-auto mb-4"
                                    src={player.photoUrl}
                                    alt={player.name}
                                />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{player.name}</h3>
                                <div className="space-y-2">
                                    <div className="text-sm text-gray-600">
                                        <strong>Contact:</strong> {player.contactNo}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <strong>Skill Level:</strong> {player.skillLevel}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <strong>Timings:</strong> {player.timings}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="mt-6">
                            <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                            <div className="space-y-3">
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={handleCreateFinalPlayer}
                                    disabled={!player.type || !player.category}
                                >
                                    Create Final Player
                                </Button>
                                <div className="text-xs text-gray-500 text-center">
                                    {!player.type || !player.category ?
                                        'Complete player categorization first' :
                                        'Ready for auction pool'
                                    }
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Detailed Information */}
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Student Information */}
                            <Card>
                                <h4 className="font-semibold text-gray-900 mb-4">Student Information</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Hikmah Student:</span>
                                        <span className={`text-sm font-medium ${player.isHikmahStudent ? 'text-green-600' : 'text-gray-400'}`}>
                                            {player.isHikmahStudent ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    {player.isHikmahStudent && (
                                        <>
                                            {player.courseEnrolled && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Course:</span>
                                                    <span className="text-sm font-medium">{player.courseEnrolled}</span>
                                                </div>
                                            )}
                                            {player.darseNizamiYear && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">DN Year:</span>
                                                    <span className="text-sm font-medium">{player.darseNizamiYear}</span>
                                                </div>
                                            )}
                                            {player.currentCourseYear && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Current Year:</span>
                                                    <span className="text-sm font-medium">{player.currentCourseYear}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </Card>

                            {/* Tournament Preferences */}
                            <Card>
                                <h4 className="font-semibold text-gray-900 mb-4">Tournament Preferences</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Play Both:</span>
                                        <span className={`text-sm font-medium ${player.playBothTournaments ? 'text-green-600' : 'text-gray-400'}`}>
                                            {player.playBothTournaments ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Icon Request:</span>
                                        <span className={`text-sm font-medium ${player.iconPlayerRequest ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {player.iconPlayerRequest ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Self Category:</span>
                                        <span>{getCategoryBadge(player.selfAssignedCategory)}</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Admin Override */}
                            <Card>
                                <h4 className="font-semibold text-gray-900 mb-4">Admin Override</h4>
                                {editing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Player Type
                                            </label>
                                            <Select
                                                value={editData.type || ''}
                                                onChange={(e) => setEditData({
                                                    ...editData,
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
                                                value={editData.category || ''}
                                                onChange={(e) => setEditData({
                                                    ...editData,
                                                    category: e.target.value
                                                })}
                                                options={[
                                                    { value: '', label: 'Select Category' },
                                                    ...categories
                                                ]}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Type:</span>
                                            <span className="text-sm font-medium">
                                                {player.type || 'Not set'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Category:</span>
                                            <span>
                                                {player.category ? getCategoryBadge(player.category) : 'Not set'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Status:</span>
                                            <span>{getStatusBadge(player.status || 'available')}</span>
                                        </div>
                                    </div>
                                )}
                            </Card>

                            {/* Registration Info */}
                            <Card>
                                <h4 className="font-semibold text-gray-900 mb-4">Registration Info</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Registered:</span>
                                        <span className="text-sm font-medium">
                                            {player.createdAt ? new Date(player.createdAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Last Updated:</span>
                                        <span className="text-sm font-medium">
                                            {player.updatedAt ? new Date(player.updatedAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Role:</span>
                                        <span className="text-sm font-medium">{player.role || 'Player'}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
