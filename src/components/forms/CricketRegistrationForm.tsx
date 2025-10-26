'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Select } from '@/components/ui';
import { useRouter } from 'next/navigation';

interface CricketRegistrationFormProps {
    eventId: string;
    eventTitle: string;
    pricePerPerson: number;
}

const courseOptions = [
    { value: 'Darse Nizami', label: 'Darse Nizami' },
    { value: 'Courses', label: 'Courses' },
    // { value: 'Reviving Hearts', label: 'Reviving Hearts' },
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

const playerRoles = [
    { value: 'Batsman', label: 'Batsman' },
    { value: 'Bowler', label: 'Bowler' },
    { value: 'Batting All Rounder', label: 'Batting All Rounder' },
    { value: 'Bowling All Rounder', label: 'Bowling All Rounder' },
];

const playingStyles: { [key: string]: { value: string; label: string }[] } = {
    'Batsman': [
        { value: 'Right Hand Batsman', label: 'Right Hand Batsman' },
        { value: 'Left Hand Batsman', label: 'Left Hand Batsman' },
    ],
    'Bowler': [
        { value: 'Right Arm Fast', label: 'Right Arm Fast' },
        { value: 'Left Arm Fast', label: 'Left Arm Fast' },
        { value: 'Right Arm Spin', label: 'Right Arm Spin' },
        { value: 'Left Arm Spin', label: 'Left Arm Spin' },
    ],
    'Batting All Rounder': [
        { value: 'Right Hand Batsman + Right Arm Fast', label: 'Right Hand Batsman + Right Arm Fast' },
        { value: 'Right Hand Batsman + Right Arm Spin', label: 'Right Hand Batsman + Right Arm Spin' },
        { value: 'Right Hand Batsman + Left Arm Fast', label: 'Right Hand Batsman + Left Arm Fast' },
        { value: 'Right Hand Batsman + Left Arm Spin', label: 'Right Hand Batsman + Left Arm Spin' },
        { value: 'Left Hand Batsman + Right Arm Fast', label: 'Left Hand Batsman + Right Arm Fast' },
        { value: 'Left Hand Batsman + Right Arm Spin', label: 'Left Hand Batsman + Right Arm Spin' },
        { value: 'Left Hand Batsman + Left Arm Fast', label: 'Left Hand Batsman + Left Arm Fast' },
        { value: 'Left Hand Batsman + Left Arm Spin', label: 'Left Hand Batsman + Left Arm Spin' },
    ],
    'Bowling All Rounder': [
        { value: 'Right Arm Fast + Right Hand Batsman', label: 'Right Arm Fast + Right Hand Batsman' },
        { value: 'Right Arm Spin + Right Hand Batsman', label: 'Right Arm Spin + Right Hand Batsman' },
        { value: 'Left Arm Fast + Right Hand Batsman', label: 'Left Arm Fast + Right Hand Batsman' },
        { value: 'Left Arm Spin + Right Hand Batsman', label: 'Left Arm Spin + Right Hand Batsman' },
        { value: 'Right Arm Fast + Left Hand Batsman', label: 'Right Arm Fast + Left Hand Batsman' },
        { value: 'Right Arm Spin + Left Hand Batsman', label: 'Right Arm Spin + Left Hand Batsman' },
        { value: 'Left Arm Fast + Left Hand Batsman', label: 'Left Arm Fast + Left Hand Batsman' },
        { value: 'Left Arm Spin + Left Hand Batsman', label: 'Left Arm Spin + Left Hand Batsman' },
    ],
};

const skillLevelStars = [
    { value: '1', label: '1 Star' },
    { value: '2', label: '2 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '5', label: '5 Stars' },
];

const categoryOptions = [
    { value: 'Platinum', label: 'Platinum' },
    { value: 'Diamond', label: 'Diamond' },
    { value: 'Gold', label: 'Gold' },
];

const paymentOptions = [
    { value: 'cash', label: "I'll pay in cash." },
    { value: 'transfer', label: "I'll transfer in the account." },
];

export default function CricketRegistrationForm({ eventId, eventTitle, pricePerPerson }: CricketRegistrationFormProps) {
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
        playedPreviousLeague: false,
        playBothTournaments: '',
        playerRole: '',
        playingStyle: '',
        skillLevel: '',
        iconPlayerRequest: '',
        selfAssignedCategory: '',
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
                alert('Registration failed: ' + data.error); // isko toast notification main convert karna hai ...
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
            <div className="p-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{eventTitle}</h2>
                {/* <p className="text-gray-600 mb-6">Fill out the form below to register for this cricket event</p> */}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="border-b pb-4 registration-dark-mode">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>

                        <div className="space-y-4">
                            <Input
                                label="Full Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter your full name"
                                className='text-black'
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
                                    // { value: '', label: 'Select...' },
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
                                        // required
                                        options={[...courseOptions]}
                                    />

                                    {formData.courseEnrolled === 'Darse Nizami' && (
                                        <Select
                                            label="In which year of Darse Nizami are you currently studying?"
                                            name="darseNizamiYear"
                                            value={formData.darseNizamiYear}
                                            onChange={handleInputChange}
                                            // required
                                            options={darseNizamiYears}
                                        />
                                    )}

                                    {formData.courseEnrolled === 'Courses' && (
                                        <Select
                                            label="In which year of course are you currently studying?"
                                            name="currentCourseYear"
                                            value={formData.currentCourseYear}
                                            onChange={handleInputChange}
                                            // required
                                            options={courseYears}
                                        />
                                    )}

                                    {(formData.courseEnrolled === 'Darse Nizami' || formData.courseEnrolled === 'Courses') && (
                                        <Select
                                            label="What are your timings?"
                                            name="timings"
                                            value={formData.timings}
                                            onChange={handleInputChange}
                                            // required
                                            options={timingOptions}
                                        />
                                    )}
                                </>
                            )}

                            {/* {formData.isHikmahStudent === 'false' && (
                                <Input
                                    label="Timings/Availability"
                                    name="timings"
                                    value={formData.timings}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter your availability"
                                />
                            )} */}
                        </div>
                    </div>

                    {/* Previous League Participation */}
                    <div className="border-b pb-4">
                        <div className="space-y-4">
                            <Select
                                label="Did you play the previous Hikmah Cricket League?"
                                name="playedPreviousLeague"
                                value={formData.playedPreviousLeague.toString()}
                                onChange={(e) => setFormData({ ...formData, playedPreviousLeague: e.target.value === 'true' })}
                                required
                                options={[
                                    { value: 'true', label: 'Yes' },
                                    { value: 'false', label: 'No' }
                                ]}
                            />
                        </div>
                    </div>

                    {/* Cricket Specific Details */}
                    <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cricket Details</h3>

                        <div className="space-y-4">
                            <Select
                                label="Will you play both the tournaments as discussed in HSL group?"
                                name="playBothTournaments"
                                value={formData.playBothTournaments}
                                onChange={handleInputChange}
                                required
                                options={[
                                    { value: 'yes', label: "Yeah, I'm in :)" },
                                    { value: 'auction_only', label: 'Only auction based one.' }
                                ]}
                            />

                            <Select
                                label="Player Role"
                                name="playerRole"
                                value={formData.playerRole}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        playerRole: e.target.value,
                                        playingStyle: '' // Reset playing style when role changes
                                    });
                                }}
                                required
                                options={playerRoles}
                            />

                            {formData.playerRole && (
                                <Select
                                    label="Playing Style"
                                    name="playingStyle"
                                    value={formData.playingStyle}
                                    onChange={handleInputChange}
                                    required
                                    options={playingStyles[formData.playerRole] || []}
                                />
                            )}

                            <Select
                                label="Your skill level"
                                name="skillLevel"
                                value={formData.skillLevel}
                                onChange={handleInputChange}
                                required
                                options={skillLevelStars}
                            />

                            <Select
                                label="Do you want to be an icon player? (captain)"
                                name="iconPlayerRequest"
                                value={formData.iconPlayerRequest}
                                onChange={handleInputChange}
                                required
                                options={[
                                    { value: 'yes', label: "Yes, I will be." },
                                    { value: 'no', label: "No, I'll play as a normal player." }
                                ]}
                            />

                            <Select
                                label="Which category best suits you"
                                name="selfAssignedCategory"
                                value={formData.selfAssignedCategory}
                                onChange={handleInputChange}
                                required
                                options={categoryOptions}
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
                                options={[...paymentOptions]}
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

