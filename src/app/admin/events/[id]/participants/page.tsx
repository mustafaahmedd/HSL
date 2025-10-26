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

// Image Modal Component
const ImageModal: React.FC<{ src: string; isOpen: boolean; onClose: () => void }> = ({ src, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative max-w-4xl max-h-full">
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <img
                    src={src}
                    alt="Profile"
                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
};

export default function EventParticipants() {
    const params = useParams();
    const eventId = params.id as string;

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<IEvent | null>(null);
    const [registrations, setRegistrations] = useState<IRegistration[]>([]);
    const [filteredRegistrations, setFilteredRegistrations] = useState<IRegistration[]>([]);
    const [editingRegistration, setEditingRegistration] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    // View state
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [searchTerm, setSearchTerm] = useState('');

    // Image modal state
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

    useEffect(() => {
        // Filter registrations based on search term
        if (searchTerm.trim() === '') {
            setFilteredRegistrations(registrations);
        } else {
            const filtered = registrations.filter(reg =>
                reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reg.contactNo.includes(searchTerm) ||
                (reg.courseEnrolled && reg.courseEnrolled.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredRegistrations(filtered);
        }
    }, [searchTerm, registrations]);

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
        } catch (error: any) {
            console.error('Failed to fetch event:', error.message);
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
                setFilteredRegistrations(data.registrations);
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Event Header with Enhanced Design */}
                {event && (
                    <div className="mb-6 bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-200">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{event.title}</h1>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
                            <div className="bg-blue-50 rounded-lg p-2 md:p-3">
                                <p className="text-gray-600 text-xs uppercase font-semibold mb-1">Type</p>
                                <p className="text-gray-900 font-medium text-sm md:text-base">{event.eventType}</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-2 md:p-3">
                                <p className="text-gray-600 text-xs uppercase font-semibold mb-1">Date</p>
                                <p className="text-gray-900 font-medium text-sm md:text-base">{new Date(event.startDate).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2 md:p-3">
                                <p className="text-gray-600 text-xs uppercase font-semibold mb-1">Venue</p>
                                <p className="text-gray-900 font-medium text-sm md:text-base">{event.venue}</p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-2 md:p-3">
                                <p className="text-gray-600 text-xs uppercase font-semibold mb-1">Participants</p>
                                <p className="text-gray-900 font-medium text-xl md:text-2xl">{registrations.length}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search and View Toggle */}
                <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex-1 w-full sm:max-w-md">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by name, contact, or course..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 p-1">
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded transition-colors ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            title="Card View"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            title="Table View"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Table View */}
                {viewMode === 'table' ? (
                    <Card className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Details</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role/Style</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredRegistrations.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                                No participants found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRegistrations.map((registration) => (
                                            <tr key={String(registration._id)} className="hover:bg-gray-50">
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <img
                                                        src={registration.photoUrl || '/placeholder.jpg'}
                                                        alt={registration.name}
                                                        onClick={() => setSelectedImage(registration.photoUrl || '/placeholder.jpg')}
                                                        className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-75 transition-opacity"
                                                    />
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 uppercase">{registration.name}</div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        {registration.contactNo}
                                                        <CopyButton text={registration.contactNo} />
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="text-xs text-gray-600 space-y-0.5">
                                                        {registration.courseEnrolled && (
                                                            <div>Course: {registration.courseEnrolled}</div>
                                                        )}
                                                        {registration.darseNizamiYear && (
                                                            <div>Year: {registration.darseNizamiYear}</div>
                                                        )}
                                                        {registration.timings && (
                                                            <div>Timings: {registration.timings}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="text-xs text-gray-600 space-y-0.5">
                                                        {(registration as any).playerRole && (
                                                            <div>{(registration as any).playerRole}</div>
                                                        )}
                                                        {(registration as any).playingStyle && (
                                                            <div>{(registration as any).playingStyle}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {getStatusBadge(registration.status)}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">PKR {registration.amountPaid || 0}</div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-sm">
                                                    <div className="flex gap-1">
                                                        <Button size="sm" variant="primary" onClick={() => startEditing(registration)}>
                                                            Edit
                                                        </Button>
                                                        <Button size="sm" variant={registration.status === 'pending' ? 'secondary' : 'primary'} onClick={() => handleMarkPayment(registration)}>
                                                            {(registration as any).isPaid ? 'Paid' : 'Pay'}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : (
                    /* Card View */
                    <div className="space-y-4">
                        {filteredRegistrations.length === 0 ? (
                            <Card className="bg-white rounded-xl shadow-lg">
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="mt-4 text-gray-500 text-lg">No participants found.</p>
                                </div>
                            </Card>
                        ) : (
                            filteredRegistrations.map((registration) => (
                                <Card key={String(registration._id)} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                                    <div className="p-4 md:p-6">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* Profile Picture */}
                                            <div className="flex-shrink-0 self-center">
                                                <img
                                                    src={registration.photoUrl || '/placeholder.jpg'}
                                                    alt={registration.name}
                                                    onClick={() => setSelectedImage(registration.photoUrl || '/placeholder.jpg')}
                                                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/placeholder.jpg';
                                                    }}
                                                />
                                            </div>

                                            {/* Main Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                                    <div className="flex-1">
                                                        {/* Name and Status */}
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h3 className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-wide">
                                                                {registration.name}
                                                            </h3>
                                                            {/* {getStatusBadge(registration.status)} */}
                                                        </div>

                                                        {/* Contact Info with Copy Button */}
                                                        <div className="flex items-center text-gray-600 mb-2 text-sm md:text-base">
                                                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            <span className="font-medium break-all">{registration.contactNo}</span>
                                                            <CopyButton text={registration.contactNo} />
                                                        </div>

                                                        {/* Combined Course Details */}
                                                        {(registration.courseEnrolled || registration.darseNizamiYear || registration.timings) && (
                                                            <div className="mb-2 text-sm text-gray-600">
                                                                <span className="font-semibold">
                                                                    {[registration.courseEnrolled, registration.darseNizamiYear, registration.timings]
                                                                        .filter(Boolean)
                                                                        .join(' • ')}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Role and Style */}
                                                        {((registration as any).playerRole || (registration as any).playingStyle) && (
                                                            <div className="mb-2 space-y-1">
                                                                {(registration as any).playerRole && (
                                                                    <div className="text-sm text-gray-600">
                                                                        <span className="font-semibold">Role:</span> {(registration as any).playerRole}
                                                                    </div>
                                                                )}
                                                                {(registration as any).playingStyle && (
                                                                    <div className="text-sm text-gray-600">
                                                                        <span className="font-semibold">Style:</span> {(registration as any).playingStyle}
                                                                    </div>
                                                                )}
                                                                {(registration as any).position && (
                                                                    <div className="text-sm text-gray-600">
                                                                        <span className="font-semibold">Position:</span> {(registration as any).position}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Team Details */}
                                                        {registration.teamName && (
                                                            <div className="mt-2 text-sm text-gray-600">
                                                                <span className="font-semibold">Team:</span> {registration.teamName}
                                                            </div>
                                                        )}

                                                        {/* Special Requirements */}
                                                        {registration.specialRequirements && (
                                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                                <p className="text-sm text-gray-600">
                                                                    <span className="font-semibold">Requirements:</span> {registration.specialRequirements}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Action Buttons */}
                                                        <div className="flex flex-wrap gap-2 mt-4">
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={() => startEditing(registration)}
                                                            >
                                                                Edit Details
                                                            </Button>
                                                            <Button
                                                                variant={(registration as any).isPaid ? "secondary" : "primary"}
                                                                size="sm"
                                                                onClick={() => handleMarkPayment(registration)}
                                                            >
                                                                {(registration as any).isPaid ? 'Edit Payment' : 'Mark Paid'}
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

                                                    {/* Payment Status */}
                                                    <div className="flex flex-col items-end gap-2">
                                                        {getPaymentStatusBadge(registration.paymentStatus || 'pending', (registration as any).isPaid || false)}
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-600">Amount</p>
                                                            <p className="text-base md:text-lg font-bold text-gray-900">PKR {registration.amountPaid || 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}

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
                                                value={editForm.currentCourseYear || editForm.darseNizamiYear || ''}
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

                {/* Image Modal */}
                <ImageModal
                    src={selectedImage || ''}
                    isOpen={selectedImage !== null}
                    onClose={() => setSelectedImage(null)}
                />
            </div>
        </div>
    );
}