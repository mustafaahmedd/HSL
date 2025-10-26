'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Select, NumberInput } from '@/components/ui';
import { IEvent } from '@/types/Event';

export default function CreateEvent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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
    });
    const [eventImages, setEventImages] = useState<File[]>([]);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('adminToken');

        try {
            const formData = new FormData();

            // Add all form fields
            formData.append('title', eventForm.title);
            formData.append('description', eventForm.description);
            formData.append('eventType', eventForm.eventType);
            formData.append('sport', eventForm.sport);
            formData.append('formTemplate', eventForm.formTemplate);
            formData.append('startDate', eventForm.startDate);
            formData.append('startTime', eventForm.startTime);
            formData.append('endTime', eventForm.endTime);
            formData.append('venue', eventForm.venue);
            formData.append('registrationType', eventForm.registrationType);
            formData.append('pricePerPerson', eventForm.pricePerPerson.toString());
            formData.append('pricePerTeam', eventForm.pricePerTeam.toString());
            formData.append('amenities', JSON.stringify(eventForm.amenities.split(',').map(a => a.trim()).filter(a => a)));
            formData.append('facilities', JSON.stringify(eventForm.facilities.split(',').map(f => f.trim()).filter(f => f)));
            formData.append('maxParticipants', eventForm.maxParticipants ? eventForm.maxParticipants.toString() : '');
            formData.append('minParticipants', eventForm.minParticipants.toString());
            formData.append('organizer', eventForm.organizer);
            formData.append('contactPhone', eventForm.contactPhone);
            formData.append('tags', JSON.stringify(eventForm.tags.split(',').map(t => t.trim()).filter(t => t)));
            formData.append('isPublished', eventForm.isPublished.toString());
            formData.append('status', 'upcoming');

            // Add images
            eventImages.forEach((image, index) => {
                formData.append(`images`, image);
            });

            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                router.push('/admin/events');
            } else {
                alert('Failed to create event: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to create event:', error);
            alert('Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEventForm({
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
        });
        setEventImages([]);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
                            <p className="text-gray-600">Fill out the form below to create a new event</p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => router.push('/admin/events')}
                        >
                            Back to Events
                        </Button>
                    </div>
                </div>

                {/* Event Creation Form */}
                <Card>
                    <div className="p-6">
                        <form onSubmit={handleCreateEvent} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Event Name"
                                    value={eventForm.title}
                                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                    required
                                />
                                <Select
                                    label="Event Type"
                                    value={eventForm.eventType}
                                    onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                                    options={[
                                        { value: 'auction', label: 'Auction' },
                                        { value: 'tournament', label: 'Tournament' },
                                        { value: 'activity', label: 'Activity' },
                                        { value: 'competition', label: 'Competition' },
                                    ]}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Sport/Activity"
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
                                    required
                                />
                                <Select
                                    label="Registration Form Template"
                                    value={eventForm.formTemplate}
                                    onChange={(e) => setEventForm({ ...eventForm, formTemplate: e.target.value })}
                                    options={[
                                        { value: 'cricket', label: 'Cricket Form' },
                                        { value: 'futsal', label: 'Futsal Form' },
                                        { value: 'padel', label: 'Padel Form' },
                                        { value: 'cycling', label: 'Cycling Form' },
                                        { value: 'generic', label: 'Generic Form' },
                                    ]}
                                    required
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
                                    label="Date"
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Venue"
                                    value={eventForm.venue}
                                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                                    placeholder="Event location"
                                    required
                                />
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <NumberInput
                                    label="Max Participants"
                                    value={eventForm.maxParticipants}
                                    onChange={(e) => setEventForm({ ...eventForm, maxParticipants: Number(e.target.value) || 0 })}
                                    placeholder="Leave empty for unlimited"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <NumberInput
                                    label="Price per Person (PKR)"
                                    value={eventForm.pricePerPerson}
                                    onChange={(e) => setEventForm({ ...eventForm, pricePerPerson: Number(e.target.value) || 0 })}
                                    min={0}
                                />
                                <NumberInput
                                    label="Price per Team (PKR)"
                                    value={eventForm.pricePerTeam}
                                    onChange={(e) => setEventForm({ ...eventForm, pricePerTeam: Number(e.target.value) || 0 })}
                                    min={0}
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Event Images
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setEventImages(Array.from(e.target.files));
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {eventImages.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-600">
                                            Selected {eventImages.length} image(s)
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <Button type="submit" variant="primary" loading={loading}>
                                    Create Event
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => router.push('/admin/events')}
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
