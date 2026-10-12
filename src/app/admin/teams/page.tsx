'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Select, Input, NumberInput } from '@/components/ui';
import { ITeam } from '@/types/Team';
import { IEvent } from '@/types/Event';
import { toast } from 'react-toastify';
import { confirmDialog } from '@/components/ui/Dialogs';
import { teamTypeOf, isAuctionTeam, pointsLeftOf, formatPoints } from './teamUtils';

export default function AdminTeams() {
    const router = useRouter();
    const [teams, setTeams] = useState<ITeam[]>([]);
    const [allTeams, setAllTeams] = useState<ITeam[]>([]);
    const [events, setEvents] = useState<IEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit modal state
    const [editingTeam, setEditingTeam] = useState<ITeam | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    // Filters
    const [filters, setFilters] = useState({
        eventId: '',
        eventType: '',
        status: '',
        search: '',
    });

    useEffect(() => {
        checkAuth();
        fetchEvents();
        fetchTeams();
    }, []);

    useEffect(() => {
        filterTeams();
    }, [filters, allTeams]);

    const checkAuth = () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
        }
    };

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/events', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.success) {
                setEvents(data.events);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        }
    };

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');

            const response = await fetch('/api/teams', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();

            if (data.success) {
                setAllTeams(data.teams);
                setTeams(data.teams);
            }
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering function
    const filterTeams = () => {
        let filtered = [...allTeams];

        // Filter by event
        if (filters.eventId) {
            filtered = filtered.filter((team: any) =>
                team.eventId?._id?.toString() === filters.eventId
            );
        }

        // Filter by event type
        if (filters.eventType) {
            filtered = filtered.filter((team: any) =>
                teamTypeOf(team) === filters.eventType
            );
        }

        // Filter by status
        if (filters.status) {
            filtered = filtered.filter((team: any) =>
                team.status === filters.status
            );
        }

        // Client-side search (name, owner, captain)
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter((team: any) => {
                const name = team.title?.toLowerCase() || '';
                const owner = team.owner?.toLowerCase() || '';
                const captain = team.captain?.toLowerCase() || '';

                return name.includes(searchLower) ||
                    owner.includes(searchLower) ||
                    captain.includes(searchLower);
            });
        }

        setTeams(filtered);
    };

    const handleEditTeam = (team: any) => {
        setEditingTeam(team);
        const auction = isAuctionTeam(team);
        setEditForm({
            title: team.title || '',
            owner: team.owner || '',
            // A team created while its event was a tournament keeps its budget in entryAmount
            totalPoints: team.totalPoints || (auction ? team.entryAmount || 0 : 0),
            pointsSpent: team.pointsSpent || 0,
            maxPlayers: team.maxPlayers || 0,
            captain: team.captain || '',
            entry: team.entry || 'unpaid',
            entryAmount: team.entryAmount || 0,
            status: team.status || 'active',
        });
    };

    const handleUpdateTeam = async () => {
        if (!editingTeam) return;

        try {
            const token = localStorage.getItem('adminToken');
            const updates: any = {
                title: editForm.title,
                status: editForm.status,
            };

            // Add captain for all teams
            updates.captain = editForm.captain || '';

            // Add event type specific fields (pointsLeft is recomputed server-side)
            if (isAuctionTeam(editingTeam)) {
                if (!editForm.owner?.trim()) {
                    toast.error('Owner is required for auction teams');
                    return;
                }
                if (!(Number(editForm.totalPoints) > 0)) {
                    toast.error('Total Points must be greater than 0');
                    return;
                }
                updates.owner = editForm.owner;
                updates.totalPoints = Number(editForm.totalPoints);
                updates.maxPlayers = editForm.maxPlayers;
            } else {
                updates.entry = editForm.entry;
                updates.entryAmount = editForm.entryAmount;
            }

            const response = await fetch('/api/teams', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    teamId: editingTeam._id?.toString(),
                    updates,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Team updated');
                setEditingTeam(null);
                setEditForm({});
                fetchTeams(); // Refresh teams list
            } else {
                toast.error('Failed to update team: ' + (data.error || data.message));
            }
        } catch (error) {
            console.error('Update team error:', error);
            toast.error('Failed to update team');
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        const team: any = allTeams.find((t: any) => t._id?.toString() === teamId);
        const ok = await confirmDialog({
            title: 'Delete team?',
            message: `${team?.title ? `"${team.title}"` : 'This team'} will be permanently deleted.`,
            confirmText: 'Delete',
            danger: true,
        });
        if (!ok) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/teams?id=${teamId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Team deleted');
                // Update both states by removing the deleted team
                setAllTeams(prev => prev.filter((team: any) => team._id?.toString() !== teamId));
                setTeams(prev => prev.filter((team: any) => team._id?.toString() !== teamId));
            } else {
                toast.error('Failed to delete team: ' + data.error);
            }
        } catch (error) {
            console.error('Delete team error:', error);
            toast.error('Failed to delete team');
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
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status as keyof typeof statusColors]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getEventTypeBadge = (type: string) => {
        const typeColors = {
            tournament: 'bg-blue-100 text-blue-800',
            competition: 'bg-purple-100 text-purple-800',
            auction: 'bg-orange-100 text-orange-800',
            activity: 'bg-green-100 text-green-800',
        };

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[type as keyof typeof typeColors]}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
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
                <div className="mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Teams Management</h1>
                            <p className="text-gray-600">Manage all event teams</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => router.push('/admin')}
                            >
                                Back to Dashboard
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => router.push('/admin/teams/create')}
                            >
                                Create New Team
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card>
                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Select
                                    label="Filter by Event"
                                    value={filters.eventId}
                                    onChange={(e) => setFilters({ ...filters, eventId: e.target.value })}
                                    options={[
                                        { value: '', label: 'All Events' },
                                        ...events.map(event => ({
                                            value: event._id?.toString() || '',
                                            label: event.title,
                                        })),
                                    ]}
                                />
                                <Select
                                    label="Filter by Type"
                                    value={filters.eventType}
                                    onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                                    options={[
                                        { value: '', label: 'All Types' },
                                        { value: 'tournament', label: 'Tournament' },
                                        { value: 'competition', label: 'Competition' },
                                        { value: 'auction', label: 'Auction' },
                                        { value: 'activity', label: 'Activity' },
                                    ]}
                                />
                                <Select
                                    label="Filter by Status"
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    options={[
                                        { value: '', label: 'All Status' },
                                        { value: 'active', label: 'Active' },
                                        { value: 'inactive', label: 'Inactive' },
                                        { value: 'eliminated', label: 'Eliminated' },
                                        { value: 'winner', label: 'Winner' },
                                    ]}
                                />
                                <Input
                                    label="Search"
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    placeholder="Search teams..."
                                    className='text-gray-900'
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Teams Grid */}
                {teams.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {teams.map((team: any) => (
                            <Card key={team._id?.toString()} className="min-w-0 hover:shadow-lg transition-shadow">
                                <div className="p-4 sm:p-6">
                                    <div className="mb-4 min-w-0">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 break-words">{team.title}</h3>
                                        <p className="text-sm text-gray-600 mb-2 break-words">
                                            {team.eventId?.title || 'Unknown Event'}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {getEventTypeBadge(teamTypeOf(team))}
                                            {getStatusBadge(team.status)}
                                        </div>
                                    </div>

                                    {/* Team Info */}
                                    <div className="space-y-2 mb-4 break-words">
                                        {isAuctionTeam(team) ? (
                                            <>
                                                <p className="text-sm text-gray-700">
                                                    <strong>Owner:</strong> {team.owner || '—'}
                                                </p>
                                                {team.captain && (
                                                    <p className="text-sm text-gray-700">
                                                        <strong>Captain:</strong> {team.captain}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-700">
                                                    <strong>Points:</strong> {formatPoints(pointsLeftOf(team))} / {formatPoints(team.totalPoints)}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                {team.captain && (
                                                    <p className="text-sm text-gray-700">
                                                        <strong>Captain:</strong> {team.captain}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-700">
                                                    <strong>Entry:</strong> {team.entry === 'paid' ? '✅ Paid' : '❌ Unpaid'}
                                                    {team.entryAmount > 0 && ` (PKR ${team.entryAmount})`}
                                                </p>
                                            </>
                                        )}
                                        <p className="text-sm text-gray-700">
                                            <strong>Players:</strong> {team.players?.length || 0}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="primary"
                                            className="flex-1 basis-full sm:basis-auto"
                                            onClick={() => router.push(`/admin/teams/${team._id}`)}
                                        >
                                            View Details
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="flex-1 sm:flex-none"
                                            onClick={() => handleEditTeam(team)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            className="flex-1 sm:flex-none"
                                            onClick={() => handleDeleteTeam(team._id?.toString())}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <div className="p-12 text-center">
                            <p className="text-gray-500 text-lg">No teams found</p>
                            <Button
                                variant="primary"
                                className="mt-4"
                                onClick={() => router.push('/admin/teams/create')}
                            >
                                Create Your First Team
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Edit Team Modal */}
                {editingTeam && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                            <div className="mt-3">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Edit Team</h3>
                                <p className="text-sm text-gray-600 mb-4 break-words">
                                    {(editingTeam as any).eventId?.title ? `${(editingTeam as any).eventId.title} · ` : ''}
                                    <span className="capitalize">{teamTypeOf(editingTeam)}</span>
                                </p>

                                <div className="space-y-4">
                                    {/* Team Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Team Title *
                                        </label>
                                        <Input
                                            value={editForm.title || ''}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            placeholder="Enter team title"
                                            className="text-gray-900"
                                        />
                                    </div>

                                    {/* Captain Field - Available for all teams */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Captain
                                        </label>
                                        <Input
                                            value={editForm.captain || ''}
                                            onChange={(e) => setEditForm({ ...editForm, captain: e.target.value })}
                                            placeholder="Enter captain name"
                                            className="text-gray-900"
                                        />
                                    </div>

                                    {/* Event Type Specific Fields (by the event's current type) */}
                                    {isAuctionTeam(editingTeam) ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Owner *
                                                </label>
                                                <Input
                                                    value={editForm.owner || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
                                                    placeholder="Enter owner name"
                                                    className="text-gray-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Total Points *
                                                </label>
                                                <NumberInput
                                                    value={editForm.totalPoints || 0}
                                                    onChange={(e: any) => setEditForm({ ...editForm, totalPoints: Number(e.target.value) })}
                                                    placeholder="Enter total points"
                                                    className="text-gray-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Max Players
                                                </label>
                                                <NumberInput
                                                    value={editForm.maxPlayers || 0}
                                                    onChange={(e: any) => setEditForm({ ...editForm, maxPlayers: Number(e.target.value) })}
                                                    placeholder="Enter max players"
                                                    className="text-gray-900"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 rounded-md bg-gray-50 p-3 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Points Spent</p>
                                                    <p className="font-semibold text-red-600">{formatPoints(editForm.pointsSpent || 0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Remaining</p>
                                                    <p className="font-semibold text-green-600">
                                                        {formatPoints((Number(editForm.totalPoints) || 0) - (editForm.pointsSpent || 0))}
                                                    </p>
                                                </div>
                                                <p className="col-span-2 text-xs text-gray-500">
                                                    Spent changes only through the auction; Remaining = Total Points − Spent.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Entry Status
                                                </label>
                                                <Select
                                                    value={editForm.entry || 'unpaid'}
                                                    onChange={(e) => setEditForm({ ...editForm, entry: e.target.value })}
                                                    options={[
                                                        { value: 'paid', label: 'Paid' },
                                                        { value: 'unpaid', label: 'Unpaid' },
                                                    ]}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Entry Amount (PKR)
                                                </label>
                                                <NumberInput
                                                    value={editForm.entryAmount || 0}
                                                    onChange={(e: any) => setEditForm({ ...editForm, entryAmount: Number(e.target.value) })}
                                                    placeholder="Enter entry amount"
                                                    className="text-gray-900"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <Select
                                            value={editForm.status || 'active'}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            options={[
                                                { value: 'active', label: 'Active' },
                                                { value: 'inactive', label: 'Inactive' },
                                                { value: 'eliminated', label: 'Eliminated' },
                                                { value: 'winner', label: 'Winner' },
                                            ]}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-2 justify-end pt-4 border-t">
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setEditingTeam(null);
                                                setEditForm({});
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={handleUpdateTeam}
                                            disabled={!editForm.title || (isAuctionTeam(editingTeam) && (!editForm.owner || !(Number(editForm.totalPoints) > 0)))}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

