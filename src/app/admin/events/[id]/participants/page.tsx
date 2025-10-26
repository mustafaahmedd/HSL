'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, Button, Input, Select } from '@/components/ui';
import { IRegistration } from '@/types/Registration';
import { IEvent } from '@/types/Event';

// Copy Button Component
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
            title={copied ? "Copied!" : "Copy to clipboard"}
        >
            {copied ? (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )}
        </button>
    );
};

export default function EventParticipants() {
    const params = useParams();
    const eventId = params.id as string;

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<IEvent | null>(null);
    const [registrations, setRegistrations] = useState<IRegistration[]>([]);
    const [editingRegistration, setEditingRegistration] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    // Payment modal states
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState<IRegistration | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isPaid, setIsPaid] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated && eventId) {
            fetchEventDetails();
            fetchEventRegistrations();
        }
    }, [isAuthenticated, eventId]);

    const checkAuth = () => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            setIsAuthenticated(true);
        }
        setLoading(false);
    };

    const fetchEventDetails = async () => {
        try {
            const response = await fetch(`/api/events/${eventId}`);
            const data = await response.json();
            if (data.success) {
                setEvent(data.event);
            }
        } catch (error) {
            console.error('Failed to fetch event:', error);
        }
    };

    const fetchEventRegistrations = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/registrations?eventId=${eventId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                setRegistrations(data.registrations);
            }
        } catch (error) {
            console.error('Failed to fetch registrations:', error);
        }
    };

    const updateRegistration = async (registrationId: string, updateData?: any) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/registrations', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    registrationId,
                    ...updateData,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setEditingRegistration(null);
                setEditForm({});
                fetchEventRegistrations();
            } else {
                alert('Failed to update registration: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to update registration:', error);
            alert('Failed to update registration');
        }
    };

    const startEditing = (registration: IRegistration) => {
        setEditingRegistration(registration._id!.toString());
        setEditForm({
            name: registration.name || '',
            contactNo: registration.contactNo || '',
            courseEnrolled: registration.courseEnrolled || '',
            darseNizamiYear: registration.darseNizamiYear || '',
            currentCourseYear: registration.currentCourseYear || '',
            teamName: registration.teamName || '',
            specialRequirements: registration.specialRequirements || '',
            status: registration.status || 'pending',
            paymentStatus: registration.paymentStatus || 'pending',
            amountPaid: registration.amountPaid || 0,
            adminNotes: (registration as any).adminNotes || '',
            photoUrl: registration.photoUrl || '',
            isHikmahStudent: registration.isHikmahStudent || false,
            timings: registration.timings || '',
            playerRole: (registration as any).playerRole || '',
            playingStyle: (registration as any).playingStyle || '',
            position: (registration as any).position || '',
        });
    };

    const handleMarkPayment = (registration: IRegistration) => {
        setSelectedRegistration(registration);
        setIsPaid((registration as any).isPaid || false);
        setPaymentAmount((registration.amountPaid || 0).toString());
        setPaymentModalOpen(true);
    };

    const handleSubmitPayment = async () => {
        if (!selectedRegistration) return;

        const updateData = {
            isPaid: isPaid,
            amountPaid: parseFloat(paymentAmount) || 0,
            paymentStatus: isPaid ? 'paid' : 'pending',
        };

        await updateRegistration(selectedRegistration._id!.toString(), updateData);
        setPaymentModalOpen(false);
        setSelectedRegistration(null);
        setPaymentAmount('');
        setIsPaid(false);
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
                {status}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: string, isPaid: boolean) => {
        if (isPaid) {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Paid
                </span>
            );
        }
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
            refunded: 'bg-blue-100 text-blue-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600">Please log in to access the admin panel.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Event Header with Enhanced Design */}
                {event && (
                    <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">{event.title}</h1>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-gray-600 text-xs uppercase font-semibold mb-1">Type</p>
                                <p className="text-gray-900 font-medium">{event.eventType}</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3">
                                <p className="text-gray-600 text-xs uppercase font-semibold mb-1">Date</p>
                                <p className="text-gray-900 font-medium">{new Date(event.startDate).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-gray-600 text-xs uppercase font-semibold mb-1">Venue</p>
                                <p className="text-gray-900 font-medium">{event.venue}</p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-3">
                                <p className="text-gray-600 text-xs uppercase font-semibold mb-1">Participants</p>
                                <p className="text-gray-900 font-medium text-2xl">{registrations.length}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Participants Grid */}
                <div className="space-y-4">
                    {registrations.length === 0 ? (
                        <Card className="bg-white rounded-xl shadow-lg">
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="mt-4 text-gray-500 text-lg">No participants registered yet.</p>
                            </div>
                        </Card>
                    ) : (
                        registrations.map((registration) => (
                            <Card key={String(registration._id)} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-start gap-6">
                                        {/* Profile Picture */}
                                        <div className="flex-shrink-0">
                                            <img
                                                src={registration.photoUrl || '/placeholder.jpg'}
                                                alt={registration.name}
                                                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder.jpg';
                                                }}
                                            />
                                        </div>

                                        {/* Main Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                                                            {registration.name}
                                                        </h3>
                                                        {getStatusBadge(registration.status)}
                                                    </div>

                                                    {/* Contact Info with Copy Button */}
                                                    <div className="flex items-center text-gray-600 mb-2">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        <span className="font-medium">{registration.contactNo}</span>
                                                        <CopyButton text={registration.contactNo} />
                                                    </div>

                                                    {/* Course & Year Details */}
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                                        {registration.courseEnrolled && (
                                                            <div className="bg-blue-50 rounded-lg p-2">
                                                                <p className="text-xs text-gray-600 font-semibold mb-0.5">Course</p>
                                                                <p className="text-sm font-medium text-gray-900">{registration.courseEnrolled}</p>
                                                            </div>
                                                        )}
                                                        {registration.darseNizamiYear && (
                                                            <div className="bg-purple-50 rounded-lg p-2">
                                                                <p className="text-xs text-gray-600 font-semibold mb-0.5">Year</p>
                                                                <p className="text-sm font-medium text-gray-900">{registration.darseNizamiYear}</p>
                                                            </div>
                                                        )}
                                                        {registration.currentCourseYear && (
                                                            <div className="bg-green-50 rounded-lg p-2">
                                                                <p className="text-xs text-gray-600 font-semibold mb-0.5">Current Year</p>
                                                                <p className="text-sm font-medium text-gray-900">{registration.currentCourseYear}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Additional Details */}
                                                    {(registration as any).playerRole && (
                                                        <div className="mt-3 flex items-center text-sm text-gray-600">
                                                            <span className="font-semibold mr-2">Role:</span>
                                                            <span>{(registration as any).playerRole}</span>
                                                        </div>
                                                    )}
                                                    {(registration as any).playingStyle && (
                                                        <div className="mt-1 flex items-center text-sm text-gray-600">
                                                            <span className="font-semibold mr-2">Style:</span>
                                                            <span>{(registration as any).playingStyle}</span>
                                                        </div>
                                                    )}
                                                    {(registration as any).position && (
                                                        <div className="mt-1 flex items-center text-sm text-gray-600">
                                                            <span className="font-semibold mr-2">Position:</span>
                                                            <span>{(registration as any).position}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Payment Status */}
                                                <div className="flex flex-col items-end gap-2 ml-4">
                                                    {getPaymentStatusBadge(registration.paymentStatus || 'pending', (registration as any).isPaid || false)}
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-600">Amount</p>
                                                        <p className="text-lg font-bold text-gray-900">PKR {registration.amountPaid || 0}</p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant={(registration as any).isPaid ? "secondary" : "primary"}
                                                        onClick={() => handleMarkPayment(registration)}
                                                    >
                                                        {(registration as any).isPaid ? 'Edit Payment' : 'Mark Paid'}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Team Details */}
                                            {registration.teamName && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        <span className="font-semibold">Team:</span> {registration.teamName}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Special Requirements */}
                                            {registration.specialRequirements && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        <span className="font-semibold">Special Requirements:</span>
                                                    </p>
                                                    <p className="text-sm text-gray-700">{registration.specialRequirements}</p>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => startEditing(registration)}
                                                >
                                                    Edit Details
                                                </Button>
                                                {registration.status === 'pending' && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to reject this registration?')) {
                                                                updateRegistration(registration._id!.toString(), {
                                                                    status: 'rejected'
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        Reject
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Payment Modal */}
                {paymentModalOpen && selectedRegistration && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Mark Payment</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isPaid}
                                            onChange={(e) => setIsPaid(e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-900">
                                            Has Paid
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Amount Paid (PKR)
                                        </label>
                                        <input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setPaymentModalOpen(false);
                                                setSelectedRegistration(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={handleSubmitPayment}
                                        >
                                            Save Payment
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editingRegistration && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                            <div className="mt-3">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Registration Details</h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Name
                                            </label>
                                            <Input
                                                value={editForm.name || ''}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Contact Number
                                            </label>
                                            <Input
                                                value={editForm.contactNo || ''}
                                                onChange={(e) => setEditForm({ ...editForm, contactNo: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Course Enrolled
                                            </label>
                                            <Input
                                                value={editForm.courseEnrolled || ''}
                                                onChange={(e) => setEditForm({ ...editForm, courseEnrolled: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Darse Nizami Year
                                            </label>
                                            <Input
                                                value={editForm.darseNizamiYear || ''}
                                                onChange={(e) => setEditForm({ ...editForm, darseNizamiYear: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Current Course Year
                                            </label>
                                            <Input
                                                value={editForm.currentCourseYear || ''}
                                                onChange={(e) => setEditForm({ ...editForm, currentCourseYear: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Timings
                                            </label>
                                            <Input
                                                value={editForm.timings || ''}
                                                onChange={(e) => setEditForm({ ...editForm, timings: e.target.value })}
                                            />
                                        </div>
                                        {editForm.teamName && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Team Name
                                                </label>
                                                <Input
                                                    value={editForm.teamName || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, teamName: e.target.value })}
                                                />
                                            </div>
                                        )}
                                        {editForm.playerRole && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Player Role
                                                </label>
                                                <Input
                                                    value={editForm.playerRole || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, playerRole: e.target.value })}
                                                />
                                            </div>
                                        )}
                                        {editForm.playingStyle && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Playing Style
                                                </label>
                                                <Input
                                                    value={editForm.playingStyle || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, playingStyle: e.target.value })}
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Status
                                            </label>
                                            <Select
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                                options={[]}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="approved">Approved</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="cancelled">Cancelled</option>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Payment Status
                                            </label>
                                            <Select
                                                value={editForm.paymentStatus}
                                                onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                                                options={[]}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="paid">Paid</option>
                                                <option value="refunded">Refunded</option>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Amount Paid
                                            </label>
                                            <Input
                                                type="number"
                                                value={editForm.amountPaid || 0}
                                                onChange={(e) => setEditForm({ ...editForm, amountPaid: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Special Requirements
                                        </label>
                                        <textarea
                                            value={editForm.specialRequirements || ''}
                                            onChange={(e) => setEditForm({ ...editForm, specialRequirements: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Admin Notes
                                        </label>
                                        <textarea
                                            value={editForm.adminNotes || ''}
                                            onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                            placeholder="Add admin notes here..."
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end pt-4 border-t">
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setEditingRegistration(null);
                                                setEditForm({});
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={() => updateRegistration(editingRegistration, editForm)}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}