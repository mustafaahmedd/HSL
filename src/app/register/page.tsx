'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RegistrationForm, { fieldConfigs } from '@/components/forms/RegistrationForm';
import { IEvent } from '@/types/Event';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournament');
  const eventId = searchParams.get('event');

  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events?published=true');
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);

        // If tournamentId or eventId is provided, find and select that event
        const targetEventId = tournamentId || eventId;
        if (targetEventId) {
          const found = data.events.find((e: IEvent) => e._id?.toString() === targetEventId);
          if (found) {
            setSelectedEvent(found);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const handleSubmit = async (formData: any) => {
    console.log("Submission is clicked")
    setLoading(true);

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
    } catch (error: any) {
      console.error('Registration error:', error);
      alert('Failed to submit registration: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (eventId: string) => {
    const event = events.find(e => e._id?.toString() === eventId);
    setSelectedEvent(event || null);
  };

  // Determine event type for dynamic fields
  const getEventType = (event: IEvent | null): string => {
    if (!event) return 'cricket';
    return event.sport || 'cricket';
  };

  const eventType = getEventType(selectedEvent);

  const config = {
    title: 'Event Registration Form',
    description: selectedEvent ? `Registering for: ${selectedEvent.title}` : 'Select an event to register',
    fields: fieldConfigs.eventRegistration(eventType, {
      events: events.map(event => ({
        value: event._id?.toString() || '',
        label: `${event.title} - ${new Date(event.startDate).toLocaleDateString()} (${event.startTime} - ${event.endTime})`
      })),
      pricePerPerson: selectedEvent?.pricePerPerson,
      preselectedEventId: selectedEvent?._id?.toString() // Pass the pre-selected event ID
    }),
    submitText: 'Submit Registration',
    cancelText: 'Cancel',
    onSubmit: handleSubmit,
    onCancel: () => router.push('/'),
    loading: loading,
    onEventChange: handleEventChange
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <RegistrationForm config={config} />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
