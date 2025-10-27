'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { IEvent } from '@/types/Event';

export default function EventDetail() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [event, setEvent] = useState<IEvent | null>(null);
    const [loading, setLoading] = useState(true);

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

    const primaryImage = event.images?.find(img => img.isPrimary) || event.images?.[0];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Hero Section */}
            <div className="relative">
                {primaryImage && (
                    <div className="h-96 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
                        <img
                            src={primaryImage.url}
                            alt={event.title}
                            className="w-full h-full object-cover opacity-30"
                        />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                <div className="relative -mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    {getEventTypeBadge(event.eventType)}
                                    {getStatusBadge(event.status)}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{event.title}</h1>
                                <p className="text-xl text-gray-200 leading-relaxed">{event.description}</p>
                            </div>
                            <div className="mt-6 md:mt-0">
                                <Link href="/">
                                    <Button variant="secondary" className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:bg-white/20">
                                        ← Back to Events
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Details */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Event Information */}
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                            <div className="p-2">
                                <h3 className="text-2xl font-bold text-white mb-6">Event Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div>
                                        <h4 className="text-lg font-semibold text-purple-300 mb-2">Date & Time</h4>
                                        <p className="text-gray-200">
                                            <strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}
                                        </p>
                                        <p className="text-gray-200">
                                            <strong>Start Time:</strong> {event.startTime} AM
                                        </p>
                                        {event.endTime && (
                                            <p className="text-gray-200">
                                                <strong>End Time:</strong> {event.endTime} PM
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-semibold text-purple-300"> ---- </h4>
                                        <p className="text-gray-200">
                                            <strong>Venue:</strong> {event.venue}
                                        </p>
                                        <p className="text-gray-200">
                                            <strong>Organizer:</strong> {event.organizer}
                                        </p>
                                        <p className="text-gray-200">
                                            <strong>Contact No:</strong> {event.contactInfo.phone}
                                        </p>
                                    </div>

                                    {/* <div> */}
                                    {/* <h4 className="text-lg font-semibold text-purple-300 mb-2">Registration</h4>
                                        <p className="text-gray-200">
                                            <strong>Type:</strong> {event.registrationType.charAt(0).toUpperCase() + event.registrationType.slice(1)}
                                        </p> */}
                                    {/* {event.maxParticipants && (
                                            <p className="text-gray-200">
                                                <strong>Max Participants:</strong> {event.maxParticipants}
                                            </p>
                                        )} */}
                                    {/* </div> */}

                                    {/* <div>
                                        <h4 className="text-lg font-semibold text-purple-300 mb-2">Pricing</h4>
                                        {event.pricePerPerson > 0 && (
                                            <p className="text-gray-200">
                                                <strong>Per Person:</strong> PKR {event.pricePerPerson}
                                            </p>
                                        )}
                                        {event.pricePerTeam > 0 && (
                                            <p className="text-gray-200">
                                                <strong>Per Team:</strong> PKR {event.pricePerTeam}
                                            </p>
                                        )}
                                        {event.pricePerPerson === 0 && event.pricePerTeam === 0 && (
                                            <p className="text-green-300 font-semibold">Free Event</p>
                                        )}
                                    </div> */}
                                </div>
                            </div>
                        </Card>

                        {/* Amenities & Facilities */}
                        {(event.amenities.length > 0 || event.facilities.length > 0) && (
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                                <div className="p-0">
                                    <h3 className="text-2xl font-bold text-white mb-4">What's Included</h3>

                                    {/* Combined horizontal list */}
                                    <div className="flex flex-wrap gap-3">
                                        {event.amenities.map((amenity, index) => (
                                            <div
                                                key={`amenity-${index}`}
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-400/30 rounded-full"
                                            >
                                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                <span className="text-gray-200 text-sm">{amenity}</span>
                                            </div>
                                        ))}

                                        {event.facilities.map((facility, index) => (
                                            <div
                                                key={`facility-${index}`}
                                                className="inline-flex items-center gap-2 px-2 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full"
                                            >
                                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                                <span className="text-gray-200 text-sm">{facility}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Registration Card */}
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                            <div className="p-2">
                                <h3 className="text-2xl font-bold text-white mb-4 text-center">Register Now</h3>
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-purple-300 mb-2">
                                            <span>
                                                <span className="text-3xl font-bold">
                                                    {event.pricePerPerson > 0 ? `PKR ${event.pricePerPerson}` : 'Free'}
                                                </span>
                                                <span className="text-base font-normal ml-1 text-purple-100">
                                                    / Per Person
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    {event.status === 'upcoming' && (
                                        <Link href={`/events/${event._id}/register`}>
                                            <Button
                                                variant="primary"
                                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                            >
                                                Register Now
                                            </Button>
                                        </Link>
                                    )}

                                    {event.status === 'live' && (
                                        <Button variant="secondary" className="w-full py-3" disabled>
                                            Event in Progress
                                        </Button>
                                    )}

                                    {event.status === 'completed' && (
                                        <Button variant="secondary" className="w-full py-3" disabled>
                                            Event Completed
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Contact Information */}
                        {/* <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                            <div className="p-4">
                                <h3 className="text-xl font-bold text-white mb-4">Contact Info</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-purple-300 font-semibold">Organizer:</span>
                                        <span className="text-gray-200">{event.organizer}</span>
                                    </div>
                                    {event.contactInfo.phone && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-purple-300 font-semibold">Phone:</span>
                                            <a
                                                href={`tel:${event.contactInfo.phone}`}
                                                className="text-blue-300 hover:text-blue-200"
                                            >
                                                {event.contactInfo.phone}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card> */}

                        {/* Event Stats */}
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                            <div className="p-4">
                                <h3 className="text-xl font-bold text-white mb-4">Event Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Max Players:</span>
                                        <span className="text-white font-semibold">{event.maxParticipants}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Registered Participants:</span>
                                        <span className="text-white font-semibold">{event.totalParticipants}</span>
                                    </div>
                                    {/* <div className="flex justify-between">
                                        <span className="text-gray-300">Revenue:</span>
                                        <span className="text-green-300 font-semibold">PKR {event.totalRevenue.toLocaleString()}</span>
                                    </div> */}
                                    {/* <div className="flex justify-between">
                                        <span className="text-gray-300">Created:</span>
                                        <span className="text-white font-semibold">
                                            {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div> */}
                                </div>
                            </div>
                        </Card>

                        {/* Event Images */}
                        {event.images && event.images.length > 0 && (
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold text-white mb-6">Event Gallery</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {event.images.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={image.url}
                                                    alt={image.caption || event.title}
                                                    className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                                                />
                                                {image.caption && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg">
                                                        <p className="text-sm">{image.caption}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
