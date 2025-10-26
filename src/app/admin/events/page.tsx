'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Select } from '@/components/ui';
import { IEvent } from '@/types/Event';

export default function AdminEvents() {
    const router = useRouter();
    const [events, setEvents] = useState<IEvent[]>([]);
    const [loading, setLoading] = useState(true);

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


    const startEdit = (event: IEvent) => {
        // Navigate to edit page (you can create this later)
        router.push(`/admin/events/${event._id}/edit`);
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
            auction: 'bg-blue-100 text-blue-800',
            tournament: 'bg-purple-100 text-purple-800',
            activity: 'bg-green-100 text-green-800',
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
                <div className="mb-6">
                    <div className="text-center mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
                        <p className="text-gray-600">Manage all events and activities</p>
                    </div>
                    <div className="flex flex-row justify-center gap-3 w-full max-w-xs mx-auto">
                        <Button
                            variant="secondary"
                            className="min-w-0 px-5 py-2 text-base text-xs font-medium flex-1"
                            onClick={() => router.push('/admin')}
                        >
                            Back to Dashboard
                        </Button>
                        <Button
                            variant="primary"
                            className="min-w-0 px-5 py-2 text-base text-xs font-medium flex-1"
                            onClick={() => router.push('/admin/events/create')}
                        >
                            Create New Event
                        </Button>
                    </div>
                </div>


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
                                    {event.title}
                                </h3>

                                <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Date:</span>
                                        <span className="font-medium">{new Date(event.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Time:</span>
                                        <span className="font-medium">{event.startTime} - {event.endTime}</span>
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
                                        className="w-full mb-4"
                                        onClick={() => window.open(`/events/${event._id}`,)}
                                    >
                                        View Event Page
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() => {
                                            window.location.href = `/admin/events/${event._id}/participants`;
                                        }}
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
