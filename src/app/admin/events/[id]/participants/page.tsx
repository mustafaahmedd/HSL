'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, Button, Input, Select } from '@/components/ui';
import { IRegistration } from '@/types/Registration';
import { IEvent } from '@/types/Event';

export default function EventParticipants() {
    const params = useParams();
    const eventId = params.id as string;

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<IEvent | null>(null);
    const [registrations, setRegistrations] = useState<IRegistration[]>([]);
    const [editingRegistration, setEditingRegistration] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});

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

    const updateRegistration = async (registrationId: string) => {
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
                    ...editForm,
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
            title: registration.eventName,
            phone: registration.contactNo,
            teamName: registration.teamName,
            specialRequirements: registration.specialRequirements,
            status: registration.status,
            paymentStatus: registration.paymentStatus,
            amountPaid: registration.amountPaid,
        });
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

    const getPaymentStatusBadge = (status: string) => {
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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Event Header */}
                {event && (
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span><strong>Type:</strong> {event.eventType}</span>
                            <span><strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}</span>
                            <span><strong>Venue:</strong> {event.venue}</span>
                            <span><strong>Participants:</strong> {registrations.length}</span>
                        </div>
                    </div>
                )}

                {/* Participants Table */}
                <Card title={`Participants (${registrations.length})`}>
                    {registrations.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No participants registered yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Participant
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact Info
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Team Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Registration
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {registrations.map((registration) => (
                                        <tr key={String(registration._id)} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {registration.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm text-gray-900">
                                                        {registration.contactNo}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {registration.teamName ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {registration.teamName}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">Individual</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(registration?.createdAt || '').toLocaleDateString()}
                                                    </div>
                                                    {registration.specialRequirements && (
                                                        <div className="text-sm text-gray-500">
                                                            <span className="font-medium">Requirements:</span> {registration.specialRequirements}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(registration.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    {getPaymentStatusBadge(registration?.paymentStatus || '')}
                                                    <span className="text-sm text-gray-500">
                                                        PKR {registration.amountPaid}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex flex-col gap-2">
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
                                                                const reason = prompt('Rejection reason:');
                                                                if (reason) {
                                                                    updateRegistration(registration._id!.toString());
                                                                }
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Edit Modal */}
                {editingRegistration && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Registration Details</h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Name
                                            </label>
                                            <Input
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <Input
                                                value={editForm.email}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phone
                                            </label>
                                            <Input
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Student ID
                                            </label>
                                            <Input
                                                value={editForm.studentId}
                                                onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Department
                                            </label>
                                            <Input
                                                value={editForm.department}
                                                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Emergency Contact
                                            </label>
                                            <Input
                                                value={editForm.emergencyContact}
                                                onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                                            />
                                        </div>
                                        {editForm.teamName && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Team Name
                                                    </label>
                                                    <Input
                                                        value={editForm.teamName || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, teamName: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Team Members
                                                    </label>
                                                    <Input
                                                        value={editForm.teamMembers || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, teamMembers: e.target.value })}
                                                        placeholder="Comma separated names"
                                                    />
                                                </div>
                                            </>
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
                                                value={editForm.amountPaid}
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
                                            value={editForm.notes || ''}
                                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                            placeholder="Add admin notes here..."
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
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
                                            onClick={() => updateRegistration(editingRegistration)}
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