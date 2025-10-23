'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Select } from '@/components/ui';
import { IEvent } from '@/types/Event';

export default function AdminEvents() {
    const router = useRouter();
    const [events, setEvents] = useState<IEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEventForm, setShowEventForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<IEvent | null>(null);

    const [eventForm, setEventForm] = useState({
        name: '',
        description: '',
        eventType: 'tournament',
        startDate: '',
        endDate: '',
        venue: '',
        registrationType: 'individual',
        pricePerPerson: 0,
        pricePerTeam: 0,
        amenities: '',
        facilities: '',
        maxParticipants: '',
        minParticipants: 1,
        organizer: '',
        contactEmail: '',
        contactPhone: '',
        tags: '',
        isPublished: true,
    });

    useEffect(() => {
        checkAuth();
        fetchEvents();
    }, []);

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
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: eventForm.name,
                    description: eventForm.description,
                    eventType: eventForm.eventType,
                    startDate: eventForm.startDate,
                    endDate: eventForm.endDate,
                    venue: eventForm.venue,
                    registrationType: eventForm.registrationType,
                    pricePerPerson: eventForm.pricePerPerson,
                    pricePerTeam: eventForm.pricePerTeam,
                    amenities: eventForm.amenities.split(',').map(a => a.trim()).filter(a => a),
                    facilities: eventForm.facilities.split(',').map(f => f.trim()).filter(f => f),
                    maxParticipants: eventForm.maxParticipants ? Number(eventForm.maxParticipants) : undefined,
                    minParticipants: eventForm.minParticipants,
                    organizer: eventForm.organizer,
                    contactInfo: {
                        email: eventForm.contactEmail,
                        phone: eventForm.contactPhone,
                    },
                    tags: eventForm.tags.split(',').map(t => t.trim()).filter(t => t),
                    isPublished: eventForm.isPublished,
                    status: 'upcoming',
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowEventForm(false);
                resetForm();
                fetchEvents();
            } else {
                alert('Failed to create event: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to create event:', error);
            alert('Failed to create event');
        }
    };

    const handleUpdateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');

        if (!editingEvent) return;

        try {
            const response = await fetch('/api/events', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    eventId: editingEvent._id,
                    updates: {
                        name: eventForm.name,
                        description: eventForm.description,
                        eventType: eventForm.eventType,
                        startDate: eventForm.startDate,
                        endDate: eventForm.endDate,
                        venue: eventForm.venue,
                        registrationType: eventForm.registrationType,
                        pricePerPerson: eventForm.pricePerPerson,
                        pricePerTeam: eventForm.pricePerTeam,
                        amenities: eventForm.amenities.split(',').map(a => a.trim()).filter(a => a),
                        facilities: eventForm.facilities.split(',').map(f => f.trim()).filter(f => f),
                        maxParticipants: eventForm.maxParticipants ? Number(eventForm.maxParticipants) : undefined,
                        minParticipants: eventForm.minParticipants,
                        organizer: eventForm.organizer,
                        contactInfo: {
                            email: eventForm.contactEmail,
                            phone: eventForm.contactPhone,
                        },
                        tags: eventForm.tags.split(',').map(t => t.trim()).filter(t => t),
                        isPublished: eventForm.isPublished,
                    },
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowEventForm(false);
                setEditingEvent(null);
                resetForm();
                fetchEvents();
            } else {
                alert('Failed to update event: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to update event:', error);
            alert('Failed to update event');
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        const token = localStorage.getItem('adminToken');

        try {
            const response = await fetch('/api/events', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ eventId }),
            });

            const data = await response.json();

            if (data.success) {
                fetchEvents();
            } else {
                alert('Failed to delete event: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to delete event:', error);
            alert('Failed to delete event');
        }
    };

    const resetForm = () => {
        setEventForm({
            name: '',
            description: '',
            eventType: 'tournament',
            startDate: '',
            endDate: '',
            venue: '',
            registrationType: 'individual',
            pricePerPerson: 0,
            pricePerTeam: 0,
            amenities: '',
            facilities: '',
            maxParticipants: '',
            minParticipants: 1,
            organizer: '',
            contactEmail: '',
            contactPhone: '',
            tags: '',
            isPublished: true,
        });
    };

    const startEdit = (event: IEvent) => {
        setEditingEvent(event);
        setEventForm({
            name: event.name,
            description: event.description,
            eventType: event.eventType,
            startDate: new Date(event.startDate).toISOString().split('T')[0],
            endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
            venue: event.venue,
            registrationType: event.registrationType,
            pricePerPerson: event.pricePerPerson,
            pricePerTeam: event.pricePerTeam,
            amenities: event.amenities.join(', '),
            facilities: event.facilities.join(', '),
            maxParticipants: event.maxParticipants?.toString() || '',
            minParticipants: event.minParticipants,
            organizer: event.organizer,
            contactEmail: event.contactInfo?.email || '',
            contactPhone: event.contactInfo?.phone || '',
            tags: event.tags.join(', '),
            isPublished: event.isPublished,
        });
        setShowEventForm(true);
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            upcoming: 'bg-blue-100 text-blue-800',
            live: 'bg-red-100 text-red-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-gray-100 text-gray-800',
        };

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status as keyof typeof statusColors]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getEventTypeBadge = (type: string) => {
        const typeColors = {
            tournament: 'bg-purple-100 text-purple-800',
            activity: 'bg-green-100 text-green-800',
            event: 'bg-blue-100 text-blue-800',
            competition: 'bg-orange-100 text-orange-800',
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
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
                        <p className="text-gray-600">Manage all events and activities</p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            variant="secondary"
                            onClick={() => router.push('/admin')}
                        >
                            Back to Dashboard
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                resetForm();
                                setEditingEvent(null);
                                setShowEventForm(true);
                            }}
                        >
                            Create New Event
                        </Button>
                    </div>
                </div>

                {/* Event Creation/Edit Form */}
                {showEventForm && (
                    <Card className="mb-8">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingEvent ? 'Edit Event' : 'Create New Event'}
                            </h2>

                            <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Event Name"
                                        value={eventForm.name}
                                        onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                                        required
                                    />
                                    <Select
                                        label="Event Type"
                                        value={eventForm.eventType}
                                        onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                                        options={[
                                            { value: 'tournament', label: 'Tournament' },
                                            { value: 'activity', label: 'Activity' },
                                            { value: 'event', label: 'Event' },
                                            { value: 'competition', label: 'Competition' },
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={eventForm.description}
                                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Describe the event..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input
                                        label="Start Date"
                                        type="date"
                                        value={eventForm.startDate}
                                        onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="End Date"
                                        type="date"
                                        value={eventForm.endDate}
                                        onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                                    />
                                    <Input
                                        label="Venue"
                                        value={eventForm.venue}
                                        onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                                        placeholder="Event location"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Registration Type"
                                        value={eventForm.registrationType}
                                        onChange={(e) => setEventForm({ ...eventForm, registrationType: e.target.value })}
                                        options={[
                                            { value: 'individual', label: 'Individual' },
                                            { value: 'team', label: 'Team' },
                                            { value: 'both', label: 'Both Individual & Team' },
                                        ]}
                                    />
                                    <Input
                                        label="Max Participants"
                                        type="number"
                                        value={eventForm.maxParticipants}
                                        onChange={(e) => setEventForm({ ...eventForm, maxParticipants: e.target.value })}
                                        placeholder="Leave empty for unlimited"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Price per Person (PKR)"
                                        type="number"
                                        value={eventForm.pricePerPerson}
                                        onChange={(e) => setEventForm({ ...eventForm, pricePerPerson: Number(e.target.value) })}
                                        min="0"
                                    />
                                    <Input
                                        label="Price per Team (PKR)"
                                        type="number"
                                        value={eventForm.pricePerTeam}
                                        onChange={(e) => setEventForm({ ...eventForm, pricePerTeam: Number(e.target.value) })}
                                        min="0"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Amenities (comma-separated)
                                        </label>
                                        <textarea
                                            value={eventForm.amenities}
                                            onChange={(e) => setEventForm({ ...eventForm, amenities: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={2}
                                            placeholder="Food, Transport, Equipment..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Facilities (comma-separated)
                                        </label>
                                        <textarea
                                            value={eventForm.facilities}
                                            onChange={(e) => setEventForm({ ...eventForm, facilities: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={2}
                                            placeholder="Ground, Changing Rooms, First Aid..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Organizer"
                                        value={eventForm.organizer}
                                        onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })}
                                        required
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tags (comma-separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={eventForm.tags}
                                            onChange={(e) => setEventForm({ ...eventForm, tags: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Sports, Outdoor, Team Building..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Contact Email"
                                        type="email"
                                        value={eventForm.contactEmail}
                                        onChange={(e) => setEventForm({ ...eventForm, contactEmail: e.target.value })}
                                    />
                                    <Input
                                        label="Contact Phone"
                                        value={eventForm.contactPhone}
                                        onChange={(e) => setEventForm({ ...eventForm, contactPhone: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isPublished"
                                        checked={eventForm.isPublished}
                                        onChange={(e) => setEventForm({ ...eventForm, isPublished: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
                                        Publish event (visible to public)
                                    </label>
                                </div>

                                <div className="flex space-x-4">
                                    <Button type="submit" variant="primary">
                                        {editingEvent ? 'Update Event' : 'Create Event'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            setShowEventForm(false);
                                            setEditingEvent(null);
                                            resetForm();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                )}

                {/* Events List */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                        <Card key={event._id?.toString()} className="hover:shadow-lg transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        {getEventTypeBadge(event.eventType)}
                                        {getStatusBadge(event.status)}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => startEdit(event)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDeleteEvent(event._id!.toString())}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                                    {event.name}
                                </h3>

                                <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Date:</span>
                                        <span className="font-medium">{new Date(event.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Venue:</span>
                                        <span className="font-medium">{event.venue}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Price:</span>
                                        <span className="font-medium text-green-600">
                                            {event.pricePerPerson > 0 ? `PKR ${event.pricePerPerson}` : 'Free'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Participants:</span>
                                        <span className="font-medium">{event.totalParticipants}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Published:</span>
                                        <span className={`font-medium ${event.isPublished ? 'text-green-600' : 'text-red-600'}`}>
                                            {event.isPublished ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <Button
                                        variant="primary"
                                        className="w-full"
                                        onClick={() => window.open(`/events/${event._id}`, '_blank')}
                                    >
                                        View Event Page
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() => window.open(`/admin/events/${event._id}/participants`, '_blank')}
                                    >
                                        View Participants ({event.totalParticipants})
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {events.length === 0 && (
                    <Card className="text-center py-12">
                        <div className="text-gray-500 mb-4">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-500">No events created yet.</p>
                        <p className="text-sm text-gray-400 mt-2">Create your first event to get started!</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
