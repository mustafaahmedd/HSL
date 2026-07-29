'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { IEvent } from '@/types/Event';
import { toast } from 'react-toastify';
import { DEFAULT_PAYMENT_ACCOUNT } from '@/lib/constants';

// Copy Button Component with Icon and Success Feedback
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.info('Copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-500/10 transition-colors duration-200 flex items-center justify-center min-w-[32px] h-8 border border-emerald-500/20"
            title={copied ? "Copied!" : "Copy to clipboard"}
        >
            {copied ? (
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )}
        </button>
    );
};

export default function RegistrationSuccess() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [event, setEvent] = useState<IEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [registrationData, setRegistrationData] = useState<any>(null);

    // Payment proof upload states
    const [paymentFile, setPaymentFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string>('');

    useEffect(() => {
        fetchEventDetails();
        const savedData = localStorage.getItem('lastRegistration');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setRegistrationData(parsed);
                if (parsed.paymentProofUrl) {
                    setUploadedUrl(parsed.paymentProofUrl);
                }
            } catch (e) {
                console.error(e);
            }
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

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentFile) {
            toast.error('Please select a payment screenshot image first');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            const regId = registrationData?.id || registrationData?._id || '';
            if (regId) formData.append('registrationId', regId);
            formData.append('eventId', eventId);
            if (registrationData?.contactNo || registrationData?.phone) {
                formData.append('contactNo', registrationData.contactNo || registrationData.phone);
            }
            formData.append('paymentProof', paymentFile);

            const res = await fetch('/api/register', {
                method: 'PATCH',
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                setUploadedUrl(data.paymentProofUrl);
                toast.success('Payment receipt uploaded successfully! Admin will verify soon.');
                // Update local storage record
                if (registrationData) {
                    localStorage.setItem('lastRegistration', JSON.stringify({
                        ...registrationData,
                        paymentProofUrl: data.paymentProofUrl
                    }));
                }
            } else {
                toast.error('Upload failed: ' + (data.error || 'Unknown error'));
            }
        } catch (err: any) {
            console.error(err);
            toast.error('Failed to upload receipt');
        } finally {
            setUploading(false);
        }
    };

    const generateWhatsAppMessage = () => {
        if (!event || !registrationData) return '';

        const message = `Assalam-o-Alaikum HSL Admin!

I have registered for "${event.title}".

My Details:
• Name: ${registrationData.name}
• Phone: ${registrationData.contactNo || registrationData.phone || '-'}
• Course: ${registrationData.courseEnrolled || '-'}

Event Details:
• Event: ${event.title}
• Date: ${new Date(event.startDate).toLocaleDateString()}
• Amount: PKR ${event.pricePerPerson || event.pricePerTeam}

${uploadedUrl ? `Payment Receipt Uploaded: ${uploadedUrl}` : 'I have made the payment. Please find the payment receipt attached.'}

Jazak'Allah!`;

        return encodeURIComponent(message);
    };

    const getWhatsAppLink = () => {
        const message = generateWhatsAppMessage();
        const phoneNumber = '923142566165';
        return `https://wa.me/${phoneNumber}?text=${message}`;
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
                <div className="text-center text-white">
                    <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
                    <Link href="/">
                        <Button className="btn-emerald px-6 py-2.5 rounded-lg text-xs">Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Success Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mb-4">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest block">HSL Registration Confirmation</span>
                    <h1 className="text-4xl font-extrabold text-white mt-1 mb-2">Registration Successful!</h1>
                    <p className="text-slate-300 text-base max-w-lg mx-auto">Your spot for <span className="text-emerald-400 font-semibold">{event.title}</span> has been reserved.</p>
                </div>

                {/* Event Details Card */}
                <div className="glass-card p-6 sm:p-8 mb-8 border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-3">Event Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                        <div>
                            <span className="text-slate-400">Event Name:</span>
                            <span className="ml-2 font-semibold text-white">{event.title}</span>
                        </div>
                        <div>
                            <span className="text-slate-400">Event Type:</span>
                            <span className="ml-2 font-semibold text-emerald-400 uppercase text-xs">{event.eventType}</span>
                        </div>
                        <div>
                            <span className="text-slate-400">Date:</span>
                            <span className="ml-2 font-semibold text-white">{new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div>
                            <span className="text-slate-400">Venue:</span>
                            <span className="ml-2 font-semibold text-white">{event.venue}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Information & Receipt Upload */}
                <div className="glass-card p-6 sm:p-8 mb-8 border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-3">Payment Details & Verification</h2>
                    
                    <div className="bg-slate-900/80 rounded-xl p-6 mb-6 border border-slate-800 text-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Fee Payable</span>
                        <div className="text-3xl font-black text-emerald-400 my-1">
                            PKR {event.pricePerPerson || event.pricePerTeam || 0}
                        </div>
                        <p className="text-xs text-slate-400">Per Participant</p>
                    </div>

                    <div className="bg-slate-900/60 rounded-xl p-6 mb-6 border border-slate-800/80 space-y-4 text-sm text-slate-200">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Official Bank & Wallet Account</h4>
                        
                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                            <span className="text-slate-400">Bank / App:</span>
                            <span className="font-semibold text-white">{event.paymentAccount?.bankName || DEFAULT_PAYMENT_ACCOUNT.bankName}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                            <span className="text-slate-400">Account Title:</span>
                            <span className="font-semibold text-white">{event.paymentAccount?.accountTitle || DEFAULT_PAYMENT_ACCOUNT.accountTitle}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                            <span className="text-slate-400">Account Number:</span>
                            <div className="flex items-center space-x-2">
                                <span className="font-mono text-emerald-300 font-bold select-all">{event.paymentAccount?.accountNumber || DEFAULT_PAYMENT_ACCOUNT.accountNumber}</span>
                                <CopyButton text={event.paymentAccount?.accountNumber || DEFAULT_PAYMENT_ACCOUNT.accountNumber} />
                            </div>
                        </div>

                        {(event.paymentAccount?.iban || DEFAULT_PAYMENT_ACCOUNT.iban) && (
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">IBAN:</span>
                                <div className="flex items-center space-x-2">
                                    <span className="font-mono text-emerald-300 text-xs font-bold select-all">{event.paymentAccount?.iban || DEFAULT_PAYMENT_ACCOUNT.iban}</span>
                                    <CopyButton text={event.paymentAccount?.iban || DEFAULT_PAYMENT_ACCOUNT.iban} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Option 1: Direct File Upload */}
                    <div className="bg-slate-900/90 rounded-xl p-6 border border-emerald-500/20 mb-6">
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <h3 className="text-base font-bold text-white">Upload Payment Receipt (Recommended)</h3>
                        </div>
                        <p className="text-xs text-slate-300 mb-4">
                            Upload your payment screenshot directly here so the admin can verify your payment immediately in the system.
                        </p>

                        {uploadedUrl ? (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-xs text-emerald-300 font-medium">Receipt Uploaded & Pending Verification</span>
                                </div>
                                <a
                                    href={uploadedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-emerald-400 hover:underline font-bold"
                                >
                                    View Receipt
                                </a>
                            </div>
                        ) : (
                            <form onSubmit={handleFileUpload} className="space-y-4">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 cursor-pointer"
                                />
                                <Button
                                    type="submit"
                                    disabled={uploading || !paymentFile}
                                    className="btn-emerald text-xs px-6 py-2.5 w-full sm:w-auto"
                                >
                                    {uploading ? 'Uploading Receipt...' : 'Upload Payment Receipt'}
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Option 2: WhatsApp Alternative */}
                    <div className="text-center pt-2">
                        <p className="text-xs text-slate-400 mb-4">Or send receipt screenshot directly on WhatsApp:</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <a
                                href={getWhatsAppLink()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-900/30"
                            >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                                </svg>
                                Send Screenshot on WhatsApp
                            </a>
                            <a
                                href="https://chat.whatsapp.com/HxdI48RUNIBAuT9PZpHhVo"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-6 py-3 btn-glass text-xs rounded-xl"
                            >
                                Join Official WhatsApp Group
                            </a>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="text-center flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href={`/events/${eventId}`}>
                        <Button className="btn-glass text-xs px-6 py-3 w-full sm:w-auto">
                            View Event Details
                        </Button>
                    </Link>
                    <Link href="/#events">
                        <Button className="btn-emerald text-xs px-6 py-3 w-full sm:w-auto">
                            Browse HSL Events
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
