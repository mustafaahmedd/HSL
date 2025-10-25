'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CricketRegistrationForm from '@/components/forms/CricketRegistrationForm';
import FutsalRegistrationForm from '@/components/forms/FutsalRegistrationForm';
import PadelRegistrationForm from '@/components/forms/PadelRegistrationForm';
import CyclingRegistrationForm from '@/components/forms/CyclingRegistrationForm';
import GenericRegistrationForm from '@/components/forms/GenericRegistrationForm';
import { IEvent } from '@/types/Event';

function EventRegistrationForm() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [event, setEvent] = useState<IEvent | null>(null);
    const [loading, setLoading] = useState(true);

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

    // Render the appropriate form based on formTemplate
    const renderForm = () => {
        const formTemplate = event.formTemplate || 'generic';
        const formProps = {
            eventId: eventId,
            eventTitle: event.title,
            pricePerPerson: event.pricePerPerson,
        };

        switch (formTemplate) {
            case 'cricket':
                return <CricketRegistrationForm {...formProps} />;
            case 'futsal':
                return <FutsalRegistrationForm {...formProps} />;
            case 'padel':
                return <PadelRegistrationForm {...formProps} />;
            case 'cycling':
                return <CyclingRegistrationForm {...formProps} />;
            case 'generic':
            default:
                return <GenericRegistrationForm {...formProps} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {renderForm()}
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