'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { IEvent } from '@/types/Event';

export default function RegistrationSuccess() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [event, setEvent] = useState<IEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [registrationData, setRegistrationData] = useState<any>(null);

    useEffect(() => {
        fetchEventDetails();
        // Get registration data from localStorage or URL params
        const savedData = localStorage.getItem('lastRegistration');
        if (savedData) {
            setRegistrationData(JSON.parse(savedData));
            localStorage.removeItem('lastRegistration');
        }
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            const response = await fetch(`/api/events/${eventId}`);
            const data = await response.json();
            if (data.success) {
                setEvent(data.event);
            }
        } catch (error) {
            console.error('Failed to fetch event:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateWhatsAppMessage = () => {
        if (!event || !registrationData) return '';

        const message = `Assalam-o-Alaikum!

I have registered for "${event.name}".

My Details:
• Name: ${registrationData.name}
• Department: ${registrationData.department}
• Phone: ${registrationData.phone}

Event Details:
• Event: ${event.name}
• Date: ${new Date(event.startDate).toLocaleDateString()}
• Amount: PKR ${event.registrationType === 'team' ? event.pricePerTeam : event.pricePerPerson}

Please confirm the payment details and provide the payment method.

Jazak'Allah!`;

        return encodeURIComponent(message);
    };

    const getWhatsAppLink = () => {
        const message = generateWhatsAppMessage();
        const phoneNumber = event?.contactInfo?.phone?.replace(/[^0-9]/g, '') || '923142566165';
        return `https://wa.me/${phoneNumber}?text=${message}`;
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
                <div className="text-center text-white">
                    <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
                    <Link href="/">
                        <Button variant="primary">Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Success Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Registration Successful!</h1>
                    <p className="text-xl text-gray-200">Your registration for "{event.name}" has been submitted successfully.</p>
                </div>

                {/* Event Details Card */}
                <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Event Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                            <div>
                                <strong>Event Name:</strong> {event.name}
                            </div>
                            <div>
                                <strong>Type:</strong> {event.eventType}
                            </div>
                            <div>
                                <strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}
                            </div>
                            <div>
                                <strong>Venue:</strong> {event.venue}
                            </div>
                            <div>
                                <strong>Registration Type:</strong> {event.registrationType}
                            </div>
                            <div>
                                <strong>Status:</strong>
                                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                    Pending Approval
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Payment Information */}
                <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Payment Information</h2>
                        <div className="bg-white/5 rounded-lg p-4 mb-6">
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-white mb-2">Participation Fee</h3>
                                <div className="text-3xl font-bold text-green-300 mb-2">
                                    PKR {event.registrationType === 'team' ? event.pricePerTeam : event.pricePerPerson}
                                </div>
                                <p className="text-gray-300">
                                    {event.registrationType === 'team' ? 'Per Team' : 'Per Person'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white/5 rounded-lg p-4">
                                <h4 className="text-lg font-semibold text-white mb-2">Payment Instructions</h4>
                                <ol className="list-decimal list-inside space-y-2 text-gray-200">
                                    <li>Contact the event organizer using the WhatsApp link below</li>
                                    <li>Provide your registration details</li>
                                    <li>Confirm the payment amount</li>
                                    <li>Follow the payment method provided by the organizer</li>
                                    <li>Send payment proof via WhatsApp</li>
                                </ol>
                            </div>

                            <div className="text-center">
                                <a
                                    href={getWhatsAppLink()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                                    </svg>
                                    Contact Organizer on WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Registration Details */}
                {registrationData && (
                    <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-white mb-4">Your Registration Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                                <div>
                                    <strong>Name:</strong> {registrationData.name}
                                </div>
                                <div>
                                    <strong>Email:</strong> {registrationData.email}
                                </div>
                                <div>
                                    <strong>Phone:</strong> {registrationData.phone}
                                </div>
                                <div>
                                    <strong>Student ID:</strong> {registrationData.studentId}
                                </div>
                                <div>
                                    <strong>Department:</strong> {registrationData.department}
                                </div>
                                <div>
                                    <strong>Emergency Contact:</strong> {registrationData.emergencyContact}
                                </div>
                                {registrationData.teamName && (
                                    <>
                                        <div>
                                            <strong>Team Name:</strong> {registrationData.teamName}
                                        </div>
                                        <div>
                                            <strong>Team Members:</strong> {registrationData.teamMembers}
                                        </div>
                                    </>
                                )}
                                {registrationData.specialRequirements && (
                                    <div className="md:col-span-2">
                                        <strong>Special Requirements:</strong> {registrationData.specialRequirements}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Next Steps */}
                <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">What's Next?</h2>
                        <div className="space-y-3 text-gray-200">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                                    1
                                </div>
                                <div>
                                    <strong>Contact Organizer:</strong> Use the WhatsApp link above to contact the event organizer
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                                    2
                                </div>
                                <div>
                                    <strong>Make Payment:</strong> Follow the payment instructions provided by the organizer
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                                    3
                                </div>
                                <div>
                                    <strong>Wait for Approval:</strong> Your registration will be reviewed and approved by the admin
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                                    4
                                </div>
                                <div>
                                    <strong>Get Confirmation:</strong> You'll receive confirmation once your registration is approved
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Action Buttons */}
                <div className="text-center space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href={`/events/${eventId}`}>
                            <Button variant="secondary" className="w-full sm:w-auto bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:bg-white/20">
                                View Event Details
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="primary" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                                Browse More Events
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
