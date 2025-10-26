'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { ITeam } from '@/types/Team';

export default function TeamDetail() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.id as string;

    const [team, setTeam] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
        fetchTeam();
    }, [teamId]);

    const checkAuth = () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
        }
    };

    const fetchTeam = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/teams/${teamId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();

            if (data.success) {
                setTeam(data.team);
            } else {
                alert('Failed to fetch team');
                router.push('/admin/teams');
            }
        } catch (error) {
            console.error('Failed to fetch team:', error);
            alert('Failed to fetch team');
            router.push('/admin/teams');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            eliminated: 'bg-red-100 text-red-800',
            winner: 'bg-yellow-100 text-yellow-800',
        };

        return (
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[status as keyof typeof statusColors]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
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

    if (!team) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Team not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
                            <p className="text-gray-600">{team.eventId?.title || 'Unknown Event'}</p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => router.push('/admin/teams')}
                        >
                            Back to Teams
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Team Info */}
                    <div className="lg:col-span-1">
                        <Card>
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Team Information</h2>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        {getStatusBadge(team.status)}
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600">Event Type</p>
                                        <p className="text-base font-semibold text-gray-900 capitalize">
                                            {team.eventType}
                                        </p>
                                    </div>

                                    {team.eventType === 'auction' ? (
                                        <>
                                            <div>
                                                <p className="text-sm text-gray-600">Owner</p>
                                                <p className="text-base font-semibold text-gray-900">{team.owner}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Total Points</p>
                                                <p className="text-base font-semibold text-gray-900">
                                                    {team.totalPoints?.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Points Spent</p>
                                                <p className="text-base font-semibold text-red-600">
                                                    {team.pointsSpent?.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Points Left</p>
                                                <p className="text-base font-semibold text-green-600">
                                                    {team.pointsLeft?.toLocaleString()}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {team.captain && (
                                                <div>
                                                    <p className="text-sm text-gray-600">Captain</p>
                                                    <p className="text-base font-semibold text-gray-900">{team.captain}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm text-gray-600">Entry Status</p>
                                                <p className="text-base font-semibold text-gray-900">
                                                    {team.entry === 'paid' ? '✅ Paid' : '❌ Unpaid'}
                                                </p>
                                            </div>
                                            {team.entryAmount > 0 && (
                                                <div>
                                                    <p className="text-sm text-gray-600">Entry Amount</p>
                                                    <p className="text-base font-semibold text-gray-900">
                                                        PKR {team.entryAmount.toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div>
                                        <p className="text-sm text-gray-600">Total Players</p>
                                        <p className="text-base font-semibold text-gray-900">
                                            {team.players?.length || 0}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600">Created</p>
                                        <p className="text-base text-gray-900">
                                            {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Players List */}
                    <div className="lg:col-span-2">
                        <Card>
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    Team Players ({team.players?.length || 0})
                                </h2>

                                {team.players && team.players.length > 0 ? (
                                    <div className="space-y-4">
                                        {team.players.map((player: any, index: number) => (
                                            <div
                                                key={player.registrationId?.toString() || index}
                                                className="border rounded-lg p-4 hover:bg-gray-50"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {player.registration?.name || 'Unknown Player'}
                                                        </h3>
                                                        <div className="mt-2 space-y-1">
                                                            {player.registration?.playerRole && (
                                                                <p className="text-sm text-gray-600">
                                                                    <strong>Role:</strong> {player.registration.playerRole}
                                                                </p>
                                                            )}
                                                            {player.registration?.playingStyle && (
                                                                <p className="text-sm text-gray-600">
                                                                    <strong>Style:</strong> {player.registration.playingStyle}
                                                                </p>
                                                            )}
                                                            {player.registration?.skillLevel && (
                                                                <p className="text-sm text-gray-600">
                                                                    <strong>Skill:</strong> {player.registration.skillLevel}
                                                                </p>
                                                            )}
                                                            {player.registration?.selfAssignedCategory && (
                                                                <p className="text-sm text-gray-600">
                                                                    <strong>Category:</strong> {player.registration.selfAssignedCategory}
                                                                </p>
                                                            )}
                                                            {player.registration?.contactNo && (
                                                                <p className="text-sm text-gray-600">
                                                                    <strong>Contact:</strong> {player.registration.contactNo}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Auction specific info */}
                                                        {team.eventType === 'auction' && player.purchasePrice && (
                                                            <div className="mt-3 pt-3 border-t">
                                                                <p className="text-sm text-gray-600">
                                                                    <strong>Purchase Price:</strong>{' '}
                                                                    <span className="text-green-600 font-semibold">
                                                                        {player.purchasePrice.toLocaleString()} points
                                                                    </span>
                                                                </p>
                                                                {player.category && (
                                                                    <p className="text-sm text-gray-600">
                                                                        <strong>Auction Category:</strong> {player.category}
                                                                    </p>
                                                                )}
                                                                {player.transactionDate && (
                                                                    <p className="text-sm text-gray-600">
                                                                        <strong>Purchased On:</strong>{' '}
                                                                        {new Date(player.transactionDate).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Player Photo */}
                                                    {player.registration?.photoUrl && (
                                                        <div className="ml-4">
                                                            <img
                                                                src={player.registration.photoUrl}
                                                                alt={player.registration.name}
                                                                className="w-16 h-16 rounded-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No players added yet</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

