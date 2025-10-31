'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Select, NumberInput } from '@/components/ui';
import { IEvent } from '@/types/Event';
import { IRegistration } from '@/types/Registration';

export default function CreateTeam() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<IEvent[]>([]);
    const [registrations, setRegistrations] = useState<IRegistration[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);

    const [teamForm, setTeamForm] = useState({
        eventId: '',
        eventType: '',
        name: '',
        // Regular event fields
        captain: '',
        entry: 'unpaid',
        entryAmount: 0,
        // Auction event fields
        owner: '',
        totalPoints: 0,
        // Common
        status: 'active',
    });

    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

    useEffect(() => {
        checkAuth();
        fetchEvents();
    }, []);

    useEffect(() => {
        if (teamForm.eventId) {
            fetchEventRegistrations(teamForm.eventId);
            const event = events.find(e => e._id?.toString() === teamForm.eventId);
            setSelectedEvent(event || null);
            if (event) {
                setTeamForm(prev => ({ ...prev, eventType: event.eventType }));
            }
        }
    }, [teamForm.eventId, events]);

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

    const fetchEventRegistrations = async (eventId: string) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/registrations?eventId=${eventId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.success) {
                setRegistrations(data.registrations);
            }
        } catch (error) {
            console.error('Failed to fetch registrations:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('adminToken');

            // Prepare team data based on event type
            const teamData: any = {
                eventId: teamForm.eventId,
                eventType: teamForm.eventType,
                name: teamForm.name,
                status: teamForm.status,
                players: selectedPlayers.map(regId => ({ registrationId: regId })),
            };

            // Add type-specific fields
            if (teamForm.eventType === 'auction') {
                teamData.owner = teamForm.owner;
                teamData.totalPoints = teamForm.totalPoints;
            } else {
                teamData.captain = teamForm.captain;
                teamData.entry = teamForm.entry;
                teamData.entryAmount = teamForm.entryAmount;
            }

            const response = await fetch('/api/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(teamData),
            });

            const data = await response.json();

            if (data.success) {
                alert('Team created successfully!'); //change this alert to Toast
                router.push('/admin/teams');
            } else {
                alert('Failed to create team: ' + data.error);
            }
        } catch (error) {
            console.error('Create team error:', error);
            alert('Failed to create team. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const togglePlayerSelection = (registrationId: string) => {
        setSelectedPlayers(prev => {
            if (prev.includes(registrationId)) {
                return prev.filter(id => id !== registrationId);
            } else {
                return [...prev, registrationId];
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Create New Team</h1>
                            <p className="text-gray-600">Add a new team for an event</p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => router.push('/admin/teams')}
                        >
                            Back to Teams
                        </Button>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="team-creation-dark-mode space-y-6">
                            {/* Event Selection */}
                            <div className="border-b pb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
                                <Select
                                    label="Select Event"
                                    value={teamForm.eventId}
                                    onChange={(e) => setTeamForm({ ...teamForm, eventId: e.target.value })}
                                    required
                                    options={[
                                        ...events.map(event => ({
                                            value: event._id?.toString() || '',
                                            label: `${event.title} (${event.eventType})`,
                                        })),
                                    ]}
                                />
                            </div>

                            {/* Team Basic Info */}
                            {teamForm.eventId && (
                                <>
                                    <div className="border-b pb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Details</h3>
                                        <div className="space-y-4">
                                            <Input
                                                label="Team Name"
                                                value={teamForm.name}
                                                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                                                required
                                                placeholder="Enter team name"
                                            />

                                            {/* Auction-specific fields */}
                                            {teamForm.eventType === 'auction' && (
                                                <>
                                                    <Input
                                                        label="Team Owner"
                                                        value={teamForm.owner}
                                                        onChange={(e) => setTeamForm({ ...teamForm, owner: e.target.value })}
                                                        required
                                                        placeholder="Enter owner name"
                                                    />
                                                    <NumberInput
                                                        label="Total Points/Budget"
                                                        value={teamForm.totalPoints}
                                                        onChange={(e) => setTeamForm({ ...teamForm, totalPoints: Number(e.target.value) })}
                                                        required
                                                        placeholder="Enter total points"
                                                    />
                                                </>
                                            )}

                                            {/* Regular event fields */}
                                            {teamForm.eventType !== 'auction' && (
                                                <>
                                                    <Input
                                                        label="Team Captain"
                                                        value={teamForm.captain}
                                                        onChange={(e) => setTeamForm({ ...teamForm, captain: e.target.value })}
                                                        placeholder="Enter captain name"
                                                    />
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Select
                                                            label="Entry Status"
                                                            value={teamForm.entry}
                                                            onChange={(e) => setTeamForm({ ...teamForm, entry: e.target.value })}
                                                            options={[
                                                                { value: 'paid', label: 'Paid' },
                                                                { value: 'unpaid', label: 'Unpaid' },
                                                            ]}
                                                        />
                                                        <Input
                                                            label="Entry Amount (PKR)"
                                                            type="number"
                                                            value={teamForm.entryAmount}
                                                            onChange={(e) => setTeamForm({ ...teamForm, entryAmount: Number(e.target.value) })}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            <Select
                                                label="Team Status"
                                                value={teamForm.status}
                                                onChange={(e) => setTeamForm({ ...teamForm, status: e.target.value })}
                                                options={[
                                                    { value: 'active', label: 'Active' },
                                                    { value: 'inactive', label: 'Inactive' },
                                                    { value: 'eliminated', label: 'Eliminated' },
                                                    { value: 'winner', label: 'Winner' },
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    {/* Player Selection */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Select Players ({selectedPlayers.length} selected)
                                        </h3>
                                        {registrations.length > 0 ? (
                                            <div className="max-h-96 overflow-y-auto border rounded-lg">
                                                {registrations.map((registration) => (
                                                    <div
                                                        key={registration._id?.toString()}
                                                        className={`p-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${selectedPlayers.includes(registration._id?.toString() || '')
                                                            ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                                            : ''
                                                            }`}
                                                        onClick={() => togglePlayerSelection(registration._id?.toString() || '')}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{registration.name}</p>
                                                                <p className="text-sm text-gray-600">
                                                                    {registration.playerRole} • {registration.playingStyle}
                                                                    {registration.selfAssignedCategory && ` • ${registration.selfAssignedCategory}`}
                                                                </p>
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPlayers.includes(registration._id?.toString() || '')}
                                                                onChange={() => { }}
                                                                className="h-5 w-5 text-blue-600"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-center py-8">
                                                No registrations found for this event
                                            </p>
                                        )}
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="flex space-x-4 pt-4">
                                        <Button type="submit" variant="primary" loading={loading}>
                                            Create Team
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => router.push('/admin/teams')}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </Card>
            </div>
        </div>
    );
}

