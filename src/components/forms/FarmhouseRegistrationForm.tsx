'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Select } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface FarmhouseRegistrationFormProps {
    eventId: string;
    eventTitle: string;
    pricePerPerson: number;
}

const courseOptions = [
    { value: 'Graduate', label: 'Graduate' },
    { value: 'Darse Nizami', label: 'Darse Nizami' },
    { value: 'Short Course', label: 'Short Course' },
];

const darseNizamiYears = [
    { value: 'Oula', label: 'Oula' },
    { value: 'Saniya', label: 'Saniya' },
    { value: 'Salisa', label: 'Salisa' },
    { value: 'Rabiya', label: 'Rabiya' },
    { value: 'Khamisa', label: 'Khamisa' },
    { value: 'Saadisa', label: 'Saadisa' },
    { value: 'Sabiya', label: 'Sabiya' },
    { value: 'Th\'amina', label: 'Th\'amina' },
];

const courseYears = [
    { value: 'Reviving Hearts', label: 'Reviving Hearts' },
    { value: 'Prep Oula', label: 'Prep Oula' },
    { value: 'QS/QHD 1', label: 'QS/QHD 1' },
    { value: 'QHD 2', label: 'QHD 2' },
    { value: 'QHD 3', label: 'QHD 3' },
    { value: 'QHD 4', label: 'QHD 4' },
];

const timingOptions = [
    { value: 'Morning (for DN)', label: 'Morning (for DN)' },
    { value: 'Evening (for DN)', label: 'Evening (for DN)' },
    { value: 'Weekday Evening', label: 'Weekday Evening' },
    { value: 'Weekend Morning', label: 'Weekend Morning' },
    { value: 'Weekend Evening', label: 'Weekend Evening' },
];

const paymentOptions = [
    { value: 'transfer', label: "I'll transfer via Bank / SadaPay / EasyPaisa." },
    { value: 'cash', label: "I'll pay in cash to admin." },
];

export default function FarmhouseRegistrationForm({ eventId, eventTitle, pricePerPerson }: FarmhouseRegistrationFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        contactNo: '',
        isHikmahStudent: '',
        courseEnrolled: '',
        darseNizamiYear: '',
        currentCourseYear: '',
        timings: '',
        paymentMethod: '',
        assurance: false,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('eventId', eventId);

            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value.toString());
            });

            const response = await fetch('/api/register', {
                method: 'POST',
                body: formDataToSend,
            });

            const data = await response.json();

            if (data.success) {
                if (data.registration) {
                    localStorage.setItem('lastRegistration', JSON.stringify(data.registration));
                }
                toast.success('Registration submitted successfully!');
                router.push(`/events/${eventId}/register/success`);
            } else {
                toast.error('Registration failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-[#0d1322] border-slate-800 text-slate-100 p-6 sm:p-8">
            <div>
                <div className="mb-6">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Farmhouse Registration</span>
                    <h2 className="text-3xl font-bold text-white mt-1">{eventTitle}</h2>
                    <p className="text-slate-400 text-sm mt-1">Please fill out your details to confirm your spot for this farmhouse event.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="border-b border-slate-800 pb-6 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Personal Information</h3>

                        <Input
                            label="Full Name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your full name"
                        />

                        <Input
                            label="Contact Number (WhatsApp)"
                            name="contactNo"
                            type="tel"
                            value={formData.contactNo}
                            onChange={handleInputChange}
                            required
                            placeholder="03xx-xxxxxxx"
                        />

                        <Select
                            label="Are you a student at Hikmah Institute?"
                            name="isHikmahStudent"
                            value={formData.isHikmahStudent}
                            onChange={handleInputChange}
                            required
                            options={[
                                { value: '', label: 'Select option...' },
                                { value: 'true', label: 'Yes' },
                                { value: 'false', label: 'No' }
                            ]}
                        />

                        {formData.isHikmahStudent === 'true' && (
                            <>
                                <Select
                                    label="Course Enrolled"
                                    name="courseEnrolled"
                                    value={formData.courseEnrolled}
                                    onChange={handleInputChange}
                                    required
                                    options={[{ value: '', label: 'Select course...' }, ...courseOptions]}
                                />

                                {formData.courseEnrolled === 'Darse Nizami' && (
                                    <Select
                                        label="Darse Nizami Year"
                                        name="darseNizamiYear"
                                        value={formData.darseNizamiYear}
                                        onChange={handleInputChange}
                                        required
                                        options={[{ value: '', label: 'Select year...' }, ...darseNizamiYears]}
                                    />
                                )}

                                {formData.courseEnrolled === 'Short Course' && (
                                    <Select
                                        label="Course Year"
                                        name="currentCourseYear"
                                        value={formData.currentCourseYear}
                                        onChange={handleInputChange}
                                        required
                                        options={[{ value: '', label: 'Select year...' }, ...courseYears]}
                                    />
                                )}

                                <Select
                                    label="Study Timings"
                                    name="timings"
                                    value={formData.timings}
                                    onChange={handleInputChange}
                                    required
                                    options={[{ value: '', label: 'Select timing...' }, ...timingOptions]}
                                />
                            </>
                        )}

                        {formData.isHikmahStudent === 'false' && (
                            <Input
                                label="Timings / General Availability"
                                name="timings"
                                value={formData.timings}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter your availability"
                            />
                        )}
                    </div>

                    {/* Payment & Confirmation */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-lg font-semibold text-white">Payment & Confirmation</h3>

                        <Select
                            label={`The contribution per person is PKR ${pricePerPerson || '2500'}`}
                            name="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={handleInputChange}
                            required
                            options={[{ value: '', label: 'Select payment method...' }, ...paymentOptions]}
                        />

                        <label className="flex items-start space-x-3 cursor-pointer pt-2">
                            <input
                                type="checkbox"
                                name="assurance"
                                checked={formData.assurance}
                                onChange={handleInputChange}
                                required
                                className="mt-1 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-slate-300">
                                I assure that I will arrive on time and strictly follow all event guidelines and decorum. <span className="text-red-400">*</span>
                            </span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-4 border-t border-slate-800">
                        <Button
                            type="button"
                            className="btn-glass text-xs px-6 py-2.5"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="btn-emerald text-xs px-6 py-2.5"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Registration'}
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    );
}
