'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { IEvent } from '@/types/Event';

const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&q=80&w=1200';

export default function EventDetail() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [event, setEvent] = useState<IEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        fetchEvent();
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

    const getStatusBadge = (status: string) => {
        return (
            <span className={`status-badge status-${status}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getEventTypeBadge = (type: string) => {
        return (
            <span className={`event-type-badge event-type-${type || 'tournament'}`}>
                {type ? type.toUpperCase() : 'EVENT'}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Event Not Found</h2>
                    <p className="text-slate-400 mb-8">The event you're looking for doesn't exist.</p>
                    <Link href="/">
                        <Button className="btn-emerald px-8 py-3 rounded-xl">
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const primaryImageObj = event.images?.find(img => img.isPrimary) || event.images?.[0];
    const bannerImageUrl = (!imageError && primaryImageObj?.url) ? primaryImageObj.url : DEFAULT_EVENT_IMAGE;

    return (
        <div className="min-h-screen bg-[#090d16] text-slate-100">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 bg-[#090d16]/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-emerald-900/30">
                            H
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">
                            Hikmah Student Life <span className="text-emerald-400 font-normal text-xs ml-1 hidden sm:inline">(HSL)</span>
                        </span>
                    </div>

                    <Link href="/#events">
                        <Button className="btn-glass text-xs px-4 py-2 border-slate-700">
                            ← Back to Events
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Hero Section Banner */}
            <div className="relative">
                <div className="h-80 sm:h-96 w-full relative overflow-hidden bg-slate-900">
                    <img
                        src={bannerImageUrl}
                        alt={event.title}
                        onError={() => setImageError(true)}
                        className="w-full h-full object-cover opacity-35"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/60 to-transparent"></div>
                </div>

                <div className="relative -mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="glass-card p-6 sm:p-8 border-slate-800">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    {getEventTypeBadge(event.eventType)}
                                    {getStatusBadge(event.status)}
                                </div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">{event.title}</h1>
                                <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl">{event.description}</p>
                            </div>
                            {event.status === 'upcoming' && (
                                <div className="flex-shrink-0">
                                    <Link href={`/events/${event._id}/register`}>
                                        <Button className="btn-emerald px-8 py-3.5 text-base rounded-xl font-bold">
                                            Register Now
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Details */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Event Information */}
                        <div className="glass-card p-6 sm:p-8">
                            <h3 className="text-2xl font-bold text-white mb-6">Event Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Date & Schedule</h4>
                                    <p className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-400">Date:</span>
                                        <span className="font-semibold text-white">{new Date(event.startDate).toLocaleDateString()}</span>
                                    </p>
                                    <p className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-400">Start Time:</span>
                                        <span className="font-semibold text-white">{event.startTime}</span>
                                    </p>
                                    {event.endTime && (
                                        <p className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-slate-400">End Time:</span>
                                            <span className="font-semibold text-white">{event.endTime}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Venue & Organizer</h4>
                                    <p className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-400">Venue:</span>
                                        <span className="font-semibold text-white">{event.venue}</span>
                                    </p>
                                    <p className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-400">Organizer:</span>
                                        <span className="font-semibold text-white">{event.organizer}</span>
                                    </p>
                                    {event.contactInfo?.phone && (
                                        <p className="flex justify-between border-b border-slate-800 pb-2">
                                            <span className="text-slate-400">Contact:</span>
                                            <span className="font-semibold text-emerald-400">{event.contactInfo.phone}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Amenities & Facilities */}
                        {(event.amenities?.length > 0 || event.facilities?.length > 0) && (
                            <div className="glass-card p-6 sm:p-8">
                                <h3 className="text-2xl font-bold text-white mb-6">What's Included</h3>
                                <div className="flex flex-wrap gap-3">
                                    {event.amenities?.map((amenity, index) => (
                                        <div
                                            key={`amenity-${index}`}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs font-medium"
                                        >
                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                            <span>{amenity}</span>
                                        </div>
                                    ))}

                                    {event.facilities?.map((facility, index) => (
                                        <div
                                            key={`facility-${index}`}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs font-medium"
                                        >
                                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                            <span>{facility}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Registration Summary Card */}
                        <div className="glass-card p-6 sm:p-8 text-center">
                            <h3 className="text-xl font-bold text-white mb-4">Registration Fee</h3>
                            <div className="mb-6">
                                <div className="text-4xl font-extrabold text-emerald-400 mb-1">
                                    {event.pricePerPerson > 0 ? `PKR ${event.pricePerPerson}` : 'Free'}
                                </div>
                                <span className="text-slate-400 text-xs uppercase tracking-wider">Per Participant</span>
                            </div>

                            {event.status === 'upcoming' && (
                                <Link href={`/events/${event._id}/register`}>
                                    <Button className="w-full btn-emerald py-3 text-sm rounded-xl font-bold">
                                        Register Now
                                    </Button>
                                </Link>
                            )}

                            {event.status === 'live' && (
                                <Button className="w-full btn-glass py-3 text-sm rounded-xl opacity-60" disabled>
                                    Event Live In Progress
                                </Button>
                            )}

                            {event.status === 'completed' && (
                                <Button className="w-full btn-glass py-3 text-sm rounded-xl opacity-60" disabled>
                                    Event Concluded
                                </Button>
                            )}
                        </div>

                        {/* Event Stats */}
                        <div className="glass-card p-6 sm:p-8">
                            <h3 className="text-lg font-bold text-white mb-4">Capacity & Registrations</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <span className="text-slate-400">Max Capacity:</span>
                                    <span className="text-white font-semibold">{event.maxParticipants || 'Unlimited'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <span className="text-slate-400">Registered Players:</span>
                                    <span className="text-emerald-400 font-semibold">{event.totalParticipants || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
