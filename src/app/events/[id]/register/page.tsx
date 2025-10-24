'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RegistrationForm, { fieldConfigs } from '@/components/forms/RegistrationForm';
import { IEvent } from '@/types/Event';

function EventRegistrationForm() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [event, setEvent] = useState<IEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

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
            console.error('Error fetching event:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegistration = async (formData: any) => {
        setSubmitting(true);
        try {
            const submitData = new FormData();

            // Add all form fields
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== 'photo' && value !== null && value !== undefined) {
                    submitData.append(key, value.toString());
                }
            });

            // Add photo
            if (formData.photo) {
                submitData.append('photo', formData.photo);
            }

            const response = await fetch('/api/register', {
                method: 'POST',
                body: submitData,
            });

            const data = await response.json();

            if (data.success) {
                router.push('/register/success');
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Failed to submit registration');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
                    <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
                    <button
                        onClick={() => router.push('/events')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Events
                    </button>
                </div>
            </div>
        );
    }

    // Determine event type for dynamic fields
    const getEventType = (event: IEvent): string => {
        return event.sport || 'generic';
    };

    const eventType = getEventType(event);

    const config = {
        title: `Register for ${event.title}`,
        description: `Join ${event.title} - ${event.description}`,
        fields: fieldConfigs.eventRegistration(eventType, {
            events: [{
                value: event._id?.toString() || '',
                label: `${event.title} - ${new Date(event.startDate).toLocaleDateString()} (${event.startTime} - ${event.endTime})`
            }],
            pricePerPerson: event.pricePerPerson,
            preselectedEventId: event._id?.toString() // Pre-select this event
        }),
        submitText: 'Complete Registration',
        cancelText: 'Cancel',
        onSubmit: handleRegistration,
        onCancel: () => router.push(`/events/${eventId}`),
        loading: submitting,
        onEventChange: () => { } // No need to change event since it's pre-selected
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <RegistrationForm config={config} />
            </div>
        </div>
    );
}

export default function EventRegistration() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        }>
            <EventRegistrationForm />
        </Suspense>
    );
}