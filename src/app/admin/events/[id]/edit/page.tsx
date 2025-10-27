'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Button, Input, Select, NumberInput } from '@/components/ui';
import { IEvent } from '@/types/Event';

export default function EditEvent() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [event, setEvent] = useState<IEvent | null>(null);

    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        eventType: 'tournament',
        sport: 'cricket',
        formTemplate: 'generic',
        startDate: '',
        startTime: '',
        endTime: '',
        venue: '',
        registrationType: 'individual',
        pricePerPerson: 0,
        pricePerTeam: 0,
        amenities: '',
        facilities: '',
        maxParticipants: 0,
        minParticipants: 1,
        organizer: '',
        contactPhone: '',
        tags: '',
        isPublished: true,
        status: 'upcoming',
    });
    const [eventImages, setEventImages] = useState<File[]>([]);

    useEffect(() => {
        checkAuth();
        fetchEvent();
    }, [eventId]);

    const checkAuth = () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
        }
    };

    const fetchEvent = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/events/${eventId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch event');
            }

            const data = await response.json();

            if (data.success && data.event) {
                const eventData = data.event;
                setEvent(eventData);

                // Format date for input
                const startDate = new Date(eventData.startDate).toISOString().split('T')[0];

                setEventForm({
                    title: eventData.title || '',
                    description: eventData.description || '',
                    eventType: eventData.eventType || 'tournament',
                    sport: eventData.sport || 'cricket',
                    formTemplate: eventData.formTemplate || 'generic',
                    startDate: startDate,
                    startTime: eventData.startTime || '',
                    endTime: eventData.endTime || '',
                    venue: eventData.venue || '',
                    registrationType: eventData.registrationType || 'individual',
                    pricePerPerson: eventData.pricePerPerson || 0,
                    pricePerTeam: eventData.pricePerTeam || 0,
                    amenities: eventData.amenities?.join(', ') || '',
                    facilities: eventData.facilities?.join(', ') || '',
                    maxParticipants: eventData.maxParticipants || 0,
                    minParticipants: eventData.minParticipants || 1,
                    organizer: eventData.organizer || '',
                    contactPhone: eventData.contactInfo?.phone || '',
                    tags: eventData.tags?.join(', ') || '',
                    isPublished: eventData.isPublished !== false,
                    status: eventData.status || 'upcoming',
                });
            }
        } catch (error) {
            console.error('Failed to fetch event:', error);
            alert('Failed to load event details');
            router.push('/admin/events');
        } finally {
            setFetchLoading(false);
        }
    };

    const handleUpdateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('adminToken');

        try {
            const updates = {
                title: eventForm.title,
                description: eventForm.description,
                eventType: eventForm.eventType,
                sport: eventForm.sport,
                formTemplate: eventForm.formTemplate,
                startDate: eventForm.startDate,
                startTime: eventForm.startTime,
                endTime: eventForm.endTime,
                venue: eventForm.venue,
                registrationType: eventForm.registrationType,
                pricePerPerson: eventForm.pricePerPerson,
                pricePerTeam: eventForm.pricePerTeam,
                amenities: eventForm.amenities.split(',').map(a => a.trim()).filter(a => a),
                facilities: eventForm.facilities.split(',').map(f => f.trim()).filter(f => f),
                maxParticipants: eventForm.maxParticipants || null,
                minParticipants: eventForm.minParticipants,
                organizer: eventForm.organizer,
                contactInfo: {
                    phone: eventForm.contactPhone,
                },
                tags: eventForm.tags.split(',').map(t => t.trim()).filter(t => t),
                isPublished: eventForm.isPublished,
                status: eventForm.status,
            };

            const response = await fetch('/api/events', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ eventId, updates }),
            });

            const data = await response.json();

            if (data.success) {
                alert('Event updated successfully!');
                router.push(`/admin/events/${eventId}/participants`);
            } else {
                alert('Failed to update event: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to update event:', error);
            alert('Failed to update event');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setEventImages(Array.from(e.target.files));
        }
    };

    if (fetchLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading event details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Button
                        variant="secondary"
                        onClick={() => router.push(`/admin/events/${eventId}/participants`)}
                    >
                        ← Back to Event
                    </Button>
                </div>

                <Card className="bg-white">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Event</h1>

                        <form onSubmit={handleUpdateEvent} className="space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Event Title"
                                        value={eventForm.title}
                                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                        required
                                    />
                                    <Select
                                        label="Event Type"
                                        value={eventForm.eventType}
                                        onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                                        options={[
                                            { value: 'tournament', label: 'Tournament' },
                                            { value: 'auction', label: 'Auction' },
                                            { value: 'activity', label: 'Activity' },
                                            { value: 'competition', label: 'Competition' },
                                        ]}
                                    />
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={eventForm.description}
                                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Event Details */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Sport"
                                        value={eventForm.sport}
                                        onChange={(e) => setEventForm({ ...eventForm, sport: e.target.value })}
                                        options={[
                                            { value: 'cricket', label: 'Cricket' },
                                            { value: 'football', label: 'Football' },
                                            { value: 'futsal', label: 'Futsal' },
                                            { value: 'cycling', label: 'Cycling' },
                                            { value: 'padel', label: 'Padel' },
                                            { value: 'badminton', label: 'Badminton' },
                                            { value: 'tennis', label: 'Tennis' },
                                            { value: 'basketball', label: 'Basketball' },
                                            { value: 'volleyball', label: 'Volleyball' },
                                            { value: 'swimming', label: 'Swimming' },
                                            { value: 'athletics', label: 'Athletics' },
                                            { value: 'academic', label: 'Academic' },
                                        ]}
                                    />
                                    <Select
                                        label="Form Template"
                                        value={eventForm.formTemplate}
                                        onChange={(e) => setEventForm({ ...eventForm, formTemplate: e.target.value })}
                                        options={[
                                            { value: 'generic', label: 'Generic' },
                                            { value: 'cricket', label: 'Cricket' },
                                            { value: 'futsal', label: 'Futsal' },
                                            { value: 'padel', label: 'Padel' },
                                            { value: 'cycling', label: 'Cycling' },
                                        ]}
                                    />
                                    <Input
                                        label="Venue"
                                        value={eventForm.venue}
                                        onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Start Date"
                                        type="date"
                                        value={eventForm.startDate}
                                        onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Start Time"
                                        type="time"
                                        value={eventForm.startTime}
                                        onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="End Time"
                                        type="time"
                                        value={eventForm.endTime}
                                        onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Registration & Pricing */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration & Pricing</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Registration Type"
                                        value={eventForm.registrationType}
                                        onChange={(e) => setEventForm({ ...eventForm, registrationType: e.target.value })}
                                        options={[
                                            { value: 'individual', label: 'Individual' },
                                            { value: 'team', label: 'Team' },
                                            { value: 'both', label: 'Both' },
                                        ]}
                                    />
                                    <Input
                                        label="Max Participants"
                                        type="number"
                                        value={eventForm.maxParticipants}
                                        onChange={(e) => setEventForm({ ...eventForm, maxParticipants: parseInt(e.target.value) || 0 })}
                                    />
                                    <Input
                                        label="Price per Person (PKR)"
                                        type="number"
                                        value={eventForm.pricePerPerson}
                                        onChange={(e) => setEventForm({ ...eventForm, pricePerPerson: parseFloat(e.target.value) || 0 })}
                                    />
                                    <Input
                                        label="Price per Team (PKR)"
                                        type="number"
                                        value={eventForm.pricePerTeam}
                                        onChange={(e) => setEventForm({ ...eventForm, pricePerTeam: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            {/* Organizer Info */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizer Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Organizer Name"
                                        value={eventForm.organizer}
                                        onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Contact Phone"
                                        type="tel"
                                        value={eventForm.contactPhone}
                                        onChange={(e) => setEventForm({ ...eventForm, contactPhone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Additional Details */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
                                <Input
                                    label="Amenities (comma-separated)"
                                    value={eventForm.amenities}
                                    onChange={(e) => setEventForm({ ...eventForm, amenities: e.target.value })}
                                    placeholder="WiFi, Parking, etc."
                                />
                                <Input
                                    label="Facilities (comma-separated)"
                                    value={eventForm.facilities}
                                    onChange={(e) => setEventForm({ ...eventForm, facilities: e.target.value })}
                                    placeholder="Ground, Equipment, etc."
                                    className="mt-4"
                                />
                                <Input
                                    label="Tags (comma-separated)"
                                    value={eventForm.tags}
                                    onChange={(e) => setEventForm({ ...eventForm, tags: e.target.value })}
                                    placeholder="popular, featured, etc."
                                    className="mt-4"
                                />
                            </div>

                            {/* Status & Publishing */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Publishing</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Status"
                                        value={eventForm.status}
                                        onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                                        options={[
                                            { value: 'upcoming', label: 'Upcoming' },
                                            { value: 'live', label: 'Live' },
                                            { value: 'completed', label: 'Completed' },
                                            { value: 'cancelled', label: 'Cancelled' },
                                        ]}
                                    />
                                    <div className="flex items-center mt-6">
                                        <input
                                            type="checkbox"
                                            checked={eventForm.isPublished}
                                            onChange={(e) => setEventForm({ ...eventForm, isPublished: e.target.checked })}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-900">
                                            Publish Event
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-4 pt-6 border-t border-gray-200">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Event'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => router.push(`/admin/events/${eventId}/participants`)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </Card>
            </div>
        </div>
    );
}
