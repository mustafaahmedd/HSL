'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Select } from '@/components/ui';
import { useRouter } from 'next/navigation';

interface PadelRegistrationFormProps {
    eventId: string;
    eventTitle: string;
    pricePerPerson: number;
}

const courseOptions = [
    { value: 'Darse Nizami', label: 'Darse Nizami' },
    { value: 'QS / QHD / Pre Oula', label: 'QS / QHD / Pre Oula' },
];

const darseNizamiYears = [
    { value: 'Oula', label: 'Oula' },
    { value: 'Saniya', label: 'Saniya' },
    { value: 'Salisa', label: 'Salisa' },
    { value: 'Rabiya', label: 'Rabiya' },
    { value: 'Saadisa', label: 'Saadisa' },
    { value: 'Sabiya', label: 'Sabiya' },
    { value: 'Th\'amina', label: 'Th\'amina' },
];

const courseYears = [
    { value: 'Reviving Hearts', label: 'Reviving Hearts' },
    { value: 'Prep Oula', label: 'Prep Oula' },
    { value: 'QS/QHD 1', label: 'QS/QHD 1' },
    { value: 'QS/QHD 2', label: 'QS/QHD 2' },
    { value: 'QHD 3', label: 'QHD 3' },
    { value: 'QHD 4', label: 'QHD 4' },
    { value: 'QHD 5', label: 'QHD 5' },
    { value: 'QHD 6', label: 'QHD 6' },
];

const timingOptions = [
    { value: 'Morning (for DN)', label: 'Morning (for DN)' },
    { value: 'Evening (for DN)', label: 'Evening (for DN)' },
    { value: 'Weekday Evening', label: 'Weekday Evening' },
    { value: 'Weekend Morning', label: 'Weekend Morning' },
    { value: 'Weekend Evening', label: 'Weekend Evening' },
];

const padelPositions = [
    { value: 'Left Side', label: 'Left Side' },
    { value: 'Right Side', label: 'Right Side' },
    { value: 'Both Sides', label: 'Both Sides' },
];

const skillLevels = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
    { value: 'Expert', label: 'Expert' },
];

const paymentOptions = [
    { value: 'cash', label: "I'll pay in cash." },
    { value: 'transfer', label: "I'll transfer in the account." },
];

export default function PadelRegistrationForm({ eventId, eventTitle, pricePerPerson }: PadelRegistrationFormProps) {
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
        position: '',
        skillLevel: '',
        paymentMethod: '',
        assurance: false,
    });
    const [photo, setPhoto] = useState<File | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhoto(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();

            // Add event ID
            formDataToSend.append('eventId', eventId);

            // Add all form fields
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value.toString());
            });

            // Add photo
            if (photo) {
                formDataToSend.append('photo', photo);
            }

            const response = await fetch('/api/register', {
                method: 'POST',
                body: formDataToSend,
            });

            const data = await response.json();

            if (data.success) {
                router.push(`/events/${eventId}/register/success`);
            } else {
                alert('Registration failed: ' + data.error);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{eventTitle}</h2>
                <p className="text-gray-600 mb-6">Fill out the form below to register for this padel event</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>

                        <div className="space-y-4">
                            <Input
                                label="Full Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter your full name"
                            />

                            <Input
                                label="Contact Number"
                                name="contactNo"
                                type="tel"
                                value={formData.contactNo}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter your contact number"
                            />

                            <Select
                                label="Are you a student at Hikmah Institute?"
                                name="isHikmahStudent"
                                value={formData.isHikmahStudent}
                                onChange={handleInputChange}
                                required
                                options={[
                                    { value: '', label: 'Select...' },
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
                                        options={[{ value: '', label: 'Select...' }, ...courseOptions]}
                                    />

                                    {formData.courseEnrolled === 'Darse Nizami' && (
                                        <Select
                                            label="In which year of Darse Nizami are you currently studying?"
                                            name="darseNizamiYear"
                                            value={formData.darseNizamiYear}
                                            onChange={handleInputChange}
                                            required
                                            options={[{ value: '', label: 'Select...' }, ...darseNizamiYears]}
                                        />
                                    )}

                                    {formData.courseEnrolled === 'QS / QHD / Pre Oula' && (
                                        <Select
                                            label="In which year of course are you currently studying?"
                                            name="currentCourseYear"
                                            value={formData.currentCourseYear}
                                            onChange={handleInputChange}
                                            required
                                            options={[{ value: '', label: 'Select...' }, ...courseYears]}
                                        />
                                    )}

                                    {(formData.courseEnrolled === 'Darse Nizami' || formData.courseEnrolled === 'QS / QHD / Pre Oula') && (
                                        <Select
                                            label="What are your timings?"
                                            name="timings"
                                            value={formData.timings}
                                            onChange={handleInputChange}
                                            required
                                            options={[{ value: '', label: 'Select...' }, ...timingOptions]}
                                        />
                                    )}
                                </>
                            )}

                            {formData.isHikmahStudent === 'false' && (
                                <Input
                                    label="Timings/Availability"
                                    name="timings"
                                    value={formData.timings}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter your availability"
                                />
                            )}
                        </div>
                    </div>

                    {/* Padel Specific Details */}
                    <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Padel Details</h3>

                        <div className="space-y-4">
                            <Select
                                label="Preferred Position"
                                name="position"
                                value={formData.position}
                                onChange={handleInputChange}
                                required
                                options={[{ value: '', label: 'Select...' }, ...padelPositions]}
                            />

                            <Select
                                label="Your skill level"
                                name="skillLevel"
                                value={formData.skillLevel}
                                onChange={handleInputChange}
                                required
                                options={[{ value: '', label: 'Select...' }, ...skillLevels]}
                            />
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Player Photo</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload Photo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                required
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                    </div>

                    {/* Payment & Confirmation */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment & Confirmation</h3>

                        <div className="space-y-4">
                            <Select
                                label={`The contribution per player will be around ${pricePerPerson || '800 - 1200'} Rs.`}
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleInputChange}
                                required
                                options={[{ value: '', label: 'Select payment method...' }, ...paymentOptions]}
                            />

                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="assurance"
                                    checked={formData.assurance}
                                    onChange={handleInputChange}
                                    required
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium">
                                    I assure that I'll reach on time and will not cause any trouble for other players. <span className="text-red-500">*</span>
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                        >
                            Submit Registration
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    );
}

