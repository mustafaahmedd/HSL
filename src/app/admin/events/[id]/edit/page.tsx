'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Button, Input, Select, NumberInput } from '@/components/ui';
import { IEvent } from '@/types/Event';
import { toast } from 'react-toastify';
import { DEFAULT_PAYMENT_ACCOUNT } from '@/lib/constants';

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
        bankName: DEFAULT_PAYMENT_ACCOUNT.bankName,
        accountTitle: DEFAULT_PAYMENT_ACCOUNT.accountTitle,
        accountNumber: DEFAULT_PAYMENT_ACCOUNT.accountNumber,
        iban: DEFAULT_PAYMENT_ACCOUNT.iban,
        paymentUpdateReason: '',
    });

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
                    bankName: eventData.paymentAccount?.bankName || DEFAULT_PAYMENT_ACCOUNT.bankName,
                    accountTitle: eventData.paymentAccount?.accountTitle || DEFAULT_PAYMENT_ACCOUNT.accountTitle,
                    accountNumber: eventData.paymentAccount?.accountNumber || DEFAULT_PAYMENT_ACCOUNT.accountNumber,
                    iban: eventData.paymentAccount?.iban || DEFAULT_PAYMENT_ACCOUNT.iban,
                    paymentUpdateReason: '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch event:', error);
            toast.error('Failed to load event details');
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
                paymentAccount: {
                    bankName: eventForm.bankName,
                    accountTitle: eventForm.accountTitle,
                    accountNumber: eventForm.accountNumber,
                    iban: eventForm.iban,
                },
                paymentUpdateReason: eventForm.paymentUpdateReason || 'Updated in admin dashboard',
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
                toast.success('Event & Payment Account updated successfully!');
                fetchEvent();
            } else {
                toast.error('Failed to update event: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to update event:', error);
            toast.error('Failed to update event');
        } finally {
            setLoading(false);
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
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
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
                                            { value: 'farmhouse', label: 'FarmHouse' },
                                            { value: 'beach', label: 'Beach Party' },
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
                                        label="Sport / Activity"
                                        value={eventForm.sport}
                                        onChange={(e) => setEventForm({ ...eventForm, sport: e.target.value })}
                                        options={[
                                            { value: 'cricket', label: 'Cricket' },
                                            { value: 'football', label: 'Football' },
                                            { value: 'futsal', label: 'Futsal' },
                                            { value: 'cycling', label: 'Cycling' },
                                            { value: 'farmhouse', label: 'FarmHouse' },
                                            { value: 'padel', label: 'Padel' },
                                            { value: 'badminton', label: 'Badminton' },
                                            { value: 'tennis', label: 'Tennis' },
                                        ]}
                                    />
                                    <Select
                                        label="Form Template"
                                        value={eventForm.formTemplate}
                                        onChange={(e) => setEventForm({ ...eventForm, formTemplate: e.target.value })}
                                        options={[
                                            { value: 'cricket', label: 'Cricket Form' },
                                            { value: 'futsal', label: 'Futsal Form' },
                                            { value: 'padel', label: 'Padel Form' },
                                            { value: 'cycling', label: 'Cycling Form' },
                                            { value: 'farmhouse', label: 'Farmhouse Form' },
                                            { value: 'generic', label: 'Generic Form' },
                                        ]}
                                    />
                                </div>
                            </div>

                            {/* Date & Location */}
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
                                    value={eventForm.startTime}
                                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                                    required
                                />
                                <Input
                                    label="End Time"
                                    value={eventForm.endTime}
                                    onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                                    required
                                />
                            </div>

                            <Input
                                label="Venue"
                                value={eventForm.venue}
                                onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                                required
                            />

                            {/* Pricing */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <NumberInput
                                    label="Price per Person (PKR)"
                                    value={eventForm.pricePerPerson}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventForm({ ...eventForm, pricePerPerson: Number(e.target.value) })}
                                />
                                <NumberInput
                                    label="Price per Team (PKR)"
                                    value={eventForm.pricePerTeam}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventForm({ ...eventForm, pricePerTeam: Number(e.target.value) })}
                                />
                            </div>

                            {/* Payment Account Configuration */}
                            <div className="border-t border-gray-200 pt-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-1">Official Event Bank Account Settings</h2>
                                <p className="text-xs text-gray-500 mb-4">Any change here is automatically tracked in the audit log for backtracing missing payments.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Bank / Wallet Name"
                                        value={eventForm.bankName}
                                        onChange={(e) => setEventForm({ ...eventForm, bankName: e.target.value })}
                                        placeholder="SadaPay / EasyPaisa / Meezan"
                                        required
                                    />
                                    <Input
                                        label="Account Title"
                                        value={eventForm.accountTitle}
                                        onChange={(e) => setEventForm({ ...eventForm, accountTitle: e.target.value })}
                                        placeholder="Mustafa Ahmed"
                                        required
                                    />
                                    <Input
                                        label="Account Number / Phone"
                                        value={eventForm.accountNumber}
                                        onChange={(e) => setEventForm({ ...eventForm, accountNumber: e.target.value })}
                                        placeholder="03142566165"
                                        required
                                    />
                                    <Input
                                        label="IBAN (Optional)"
                                        value={eventForm.iban}
                                        onChange={(e) => setEventForm({ ...eventForm, iban: e.target.value })}
                                        placeholder="PK48SADA0000003142566165"
                                    />
                                </div>
                                <div className="mt-3">
                                    <Input
                                        label="Reason for Account Change (Optional Audit Note)"
                                        value={eventForm.paymentUpdateReason}
                                        onChange={(e) => setEventForm({ ...eventForm, paymentUpdateReason: e.target.value })}
                                        placeholder="e.g. Switched to new SadaPay wallet for batch 2 payments"
                                    />
                                </div>
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

                {/* Audit Log Card: Bank Account Change History */}
                <Card className="bg-white border-blue-100">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Bank Account Audit Trail & History Log</h2>
                                <p className="text-xs text-gray-500">Historical records of all payment account details configured for this event to trace back any missing payment receipts.</p>
                            </div>
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                                {event?.paymentAccountHistory?.length || 0} Log Entry(s)
                            </span>
                        </div>

                        {event?.paymentAccountHistory && event.paymentAccountHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-gray-200 text-gray-700">
                                            <th className="p-3 font-semibold">Timestamp</th>
                                            <th className="p-3 font-semibold">Bank / Wallet</th>
                                            <th className="p-3 font-semibold">Account Title</th>
                                            <th className="p-3 font-semibold">Account Number</th>
                                            <th className="p-3 font-semibold">IBAN</th>
                                            <th className="p-3 font-semibold">Updated By / Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {event.paymentAccountHistory.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="p-3 font-mono text-gray-600 whitespace-nowrap">
                                                    {new Date(item.updatedAt).toLocaleString()}
                                                </td>
                                                <td className="p-3 font-semibold text-blue-600">{item.bankName}</td>
                                                <td className="p-3 text-gray-900">{item.accountTitle}</td>
                                                <td className="p-3 font-mono font-bold text-gray-800">{item.accountNumber}</td>
                                                <td className="p-3 font-mono text-gray-500">{item.iban || '-'}</td>
                                                <td className="p-3 text-gray-600">
                                                    <span className="font-semibold text-gray-800">{item.updatedBy || 'Admin'}</span>
                                                    {item.reason && <span className="block text-[11px] text-gray-500">{item.reason}</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-500 text-xs">
                                No historical bank account changes logged yet.
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
