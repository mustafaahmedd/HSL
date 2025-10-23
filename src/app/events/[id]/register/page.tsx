'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Select, NumberInput } from '@/components/ui';
import { IEvent } from '@/types/Event';

export default function EventRegistration() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const eventId = params.id as string || searchParams.get('event');

    const [event, setEvent] = useState<IEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const [registrationForm, setRegistrationForm] = useState({
        name: '',
        email: '',
        phone: '',
        studentId: '',
        department: '',
        teamName: '',
        teamMembers: '',
        emergencyContact: '',
        specialRequirements: '',
    });

    useEffect(() => {
        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    const fetchEvent = async () => {
        try {
            const response = await fetch(`/api/events/${eventId}`);
            const data = await response.json();

            if (data.success) {
                setEvent(data.event);
            } else {
                console.error('Failed to fetch event:', data.error);
            }
        } catch (error) {
            console.error('Failed to fetch event:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/registrations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...registrationForm,
                    eventId: eventId,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Save registration data for success page
                localStorage.setItem('lastRegistration', JSON.stringify({
                    ...registrationForm,
                    eventName: event?.name,
                    eventType: event?.eventType,
                    amount: event?.registrationType === 'team' ? event?.pricePerTeam : event?.pricePerPerson,
                }));

                router.push(`/events/${eventId}/register/success`);
            } else {
                alert('Registration failed: ' + data.error);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            upcoming: 'bg-blue-100 text-blue-800',
            live: 'bg-red-100 text-red-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-gray-100 text-gray-800',
        };

        return (
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[status as keyof typeof statusColors]}`}>
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
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${typeColors[type as keyof typeof typeColors]}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Event Not Found</h2>
                    <p className="text-gray-300 mb-8">The event you're looking for doesn't exist.</p>
                    <Link href="/">
                        <Button variant="primary" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600">
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (registrationSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-3xl font-bold text-white mb-4">Registration Successful!</h2>
                    <p className="text-gray-300 mb-6">
                        Thank you for registering for <strong>{event.name}</strong>.
                        You will receive a confirmation email shortly.
                    </p>
                    <div className="space-y-4">
                        <Link href="/">
                            <Button variant="primary" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
                                Back to Home
                            </Button>
                        </Link>
                        <Link href={`/events/${event._id}`}>
                            <Button variant="secondary" className="w-full bg-white/10 backdrop-blur-sm text-white border-2 border-white/20">
                                View Event Details
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (event.status !== 'upcoming') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
                    <div className="text-6xl mb-4">🚫</div>
                    <h2 className="text-3xl font-bold text-white mb-4">Registration Closed</h2>
                    <p className="text-gray-300 mb-6">
                        Registration for <strong>{event.name}</strong> is not currently available.
                        Event status: {getStatusBadge(event.status)}
                    </p>
                    <div className="space-y-4">
                        <Link href="/">
                            <Button variant="primary" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
                                Back to Home
                            </Button>
                        </Link>
                        <Link href={`/events/${event._id}`}>
                            <Button variant="secondary" className="w-full bg-white/10 backdrop-blur-sm text-white border-2 border-white/20">
                                View Event Details
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Event Header */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                {getEventTypeBadge(event.eventType)}
                                {getStatusBadge(event.status)}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{event.name}</h1>
                            <p className="text-gray-200">{event.description}</p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <Link href={`/events/${event._id}`}>
                                <Button variant="secondary" className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:bg-white/20">
                                    ← Back to Event
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-purple-300 font-semibold">Date:</span>
                            <span className="text-white ml-2">{new Date(event.startDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="text-purple-300 font-semibold">Venue:</span>
                            <span className="text-white ml-2">{event.venue}</span>
                        </div>
                        <div>
                            <span className="text-purple-300 font-semibold">Price:</span>
                            <span className="text-green-300 ml-2 font-semibold">
                                {event.pricePerPerson > 0 ? `PKR ${event.pricePerPerson}` : 'Free'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Registration Form */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">Event Registration</h2>

                        <form onSubmit={handleRegistration} className="space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h3 className="text-lg font-semibold text-purple-300 mb-4">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={registrationForm.name}
                                            onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={registrationForm.email}
                                            onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Enter your email address"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={registrationForm.phone}
                                            onChange={(e) => setRegistrationForm({ ...registrationForm, phone: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Enter your phone number"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-1">
                                            Student ID
                                        </label>
                                        <input
                                            type="text"
                                            value={registrationForm.studentId}
                                            onChange={(e) => setRegistrationForm({ ...registrationForm, studentId: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Enter your student ID"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-1">
                                            Department
                                        </label>
                                        <input
                                            type="text"
                                            value={registrationForm.department}
                                            onChange={(e) => setRegistrationForm({ ...registrationForm, department: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Enter your department"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-1">
                                            Emergency Contact
                                        </label>
                                        <input
                                            type="tel"
                                            value={registrationForm.emergencyContact}
                                            onChange={(e) => setRegistrationForm({ ...registrationForm, emergencyContact: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Enter emergency contact number"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Team Information (if applicable) */}
                            {event.registrationType === 'team' || event.registrationType === 'both' ? (
                                <div>
                                    <h3 className="text-lg font-semibold text-purple-300 mb-4">Team Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-1">
                                                Team Name
                                            </label>
                                            <input
                                                type="text"
                                                value={registrationForm.teamName}
                                                onChange={(e) => setRegistrationForm({ ...registrationForm, teamName: e.target.value })}
                                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="Enter team name"
                                                required={event.registrationType === 'team'}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-1">
                                                Team Members (comma-separated)
                                            </label>
                                            <textarea
                                                value={registrationForm.teamMembers}
                                                onChange={(e) => setRegistrationForm({ ...registrationForm, teamMembers: e.target.value })}
                                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                rows={3}
                                                placeholder="Enter team member names separated by commas"
                                                required={event.registrationType === 'team'}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {/* Special Requirements */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-1">
                                    Special Requirements or Notes
                                </label>
                                <textarea
                                    value={registrationForm.specialRequirements}
                                    onChange={(e) => setRegistrationForm({ ...registrationForm, specialRequirements: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    rows={3}
                                    placeholder="Any special dietary requirements, accessibility needs, etc."
                                />
                            </div>

                            {/* Registration Summary */}
                            <div className="bg-white/5 rounded-lg p-4">
                                <h4 className="text-lg font-semibold text-white mb-2">Registration Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Event:</span>
                                        <span className="text-white font-medium">{event.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Registration Type:</span>
                                        <span className="text-white font-medium">
                                            {event.registrationType.charAt(0).toUpperCase() + event.registrationType.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Total Cost:</span>
                                        <span className="text-green-300 font-bold text-lg">
                                            {event.pricePerPerson > 0 ? `PKR ${event.pricePerPerson}` : 'Free'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex space-x-4">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                    loading={submitting}
                                >
                                    {submitting ? 'Registering...' : 'Complete Registration'}
                                </Button>
                                <Link href={`/events/${event._id}`}>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:bg-white/20"
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </div>
                </Card>
            </div>
        </div>
    );
}
