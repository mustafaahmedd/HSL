'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Select } from '@/components/ui';

export interface RegistrationField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'number';
    required?: boolean;
    options?: { value: string; label: string }[];
    placeholder?: string;
    defaultValue?: any;
    validation?: (value: any) => string | null;
    conditional?: {
        field: string;
        value: any | any[];
    };
}

export interface RegistrationFormConfig {
    title: string;
    description?: string;
    fields: RegistrationField[];
    submitText?: string;
    cancelText?: string;
    onSubmit: (data: any) => Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
    onEventChange?: (eventId: string) => void;
}

const skillLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'professional', label: 'Professional' },
];

const categories = [
    { value: 'Platinum', label: 'Platinum' },
    { value: 'Diamond', label: 'Diamond' },
    { value: 'Gold', label: 'Gold' },
    { value: 'Silver', label: 'Silver' },
    { value: 'Bronze', label: 'Bronze' },
];

const timingOptions = [
    { value: 'Morning (for DN)', label: 'Morning (for DN)' },
    { value: 'Evening (for DN)', label: 'Evening (for DN)' },
    { value: 'Weekday Evening', label: 'Weekday Evening' },
    { value: 'Weekend Morning', label: 'Weekend Morning' },
    { value: 'Weekend Evening', label: 'Weekend Evening' },
];

const courseOptions = [
    { value: 'Darse Nizami', label: 'Darse Nizami' },
    { value: 'QS / QHD / Pre Oula', label: 'QS / QHD / Pre Oula' },
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

const playerTypes = [
    { value: 'Batsman', label: 'Batsman' },
    { value: 'Bowler', label: 'Bowler' },
    { value: 'Batting All Rounder', label: 'Batting All Rounder' },
    { value: 'Bowling All Rounder', label: 'Bowling All Rounder' },
];

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

// Football specific fields
const footballPositions = [
    { value: 'Goalkeeper', label: 'Goalkeeper' },
    { value: 'Defender', label: 'Defender' },
    { value: 'Midfielder', label: 'Midfielder' },
    { value: 'Forward', label: 'Forward' },
    { value: 'Winger', label: 'Winger' },
];

const footballSkillLevels = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
    { value: 'Professional', label: 'Professional' },
];

// Futsal specific fields
const futsalPositions = [
    { value: 'Goalkeeper', label: 'Goalkeeper' },
    { value: 'Defender', label: 'Defender' },
    { value: 'Midfielder', label: 'Midfielder' },
    { value: 'Forward', label: 'Forward' },
    { value: 'Pivot', label: 'Pivot' },
];

// Cycling specific fields
const cyclingCategories = [
    { value: 'Road Cycling', label: 'Road Cycling' },
    { value: 'Mountain Biking', label: 'Mountain Biking' },
    { value: 'Track Cycling', label: 'Track Cycling' },
    { value: 'Cyclocross', label: 'Cyclocross' },
];

// Padel specific fields
const padelPositions = [
    { value: 'Left Side', label: 'Left Side' },
    { value: 'Right Side', label: 'Right Side' },
    { value: 'Both Sides', label: 'Both Sides' },
];

// Badminton specific fields
const badmintonCategories = [
    { value: 'Singles', label: 'Singles' },
    { value: 'Doubles', label: 'Doubles' },
    { value: 'Mixed Doubles', label: 'Mixed Doubles' },
];

// Tennis specific fields
const tennisCategories = [
    { value: 'Singles', label: 'Singles' },
    { value: 'Doubles', label: 'Doubles' },
    { value: 'Mixed Doubles', label: 'Mixed Doubles' },
];

// Basketball specific fields
const basketballPositions = [
    { value: 'Point Guard', label: 'Point Guard' },
    { value: 'Shooting Guard', label: 'Shooting Guard' },
    { value: 'Small Forward', label: 'Small Forward' },
    { value: 'Power Forward', label: 'Power Forward' },
    { value: 'Center', label: 'Center' },
];

// Volleyball specific fields
const volleyballPositions = [
    { value: 'Setter', label: 'Setter' },
    { value: 'Outside Hitter', label: 'Outside Hitter' },
    { value: 'Middle Blocker', label: 'Middle Blocker' },
    { value: 'Opposite Hitter', label: 'Opposite Hitter' },
    { value: 'Libero', label: 'Libero' },
];

// Swimming specific fields
const swimmingCategories = [
    { value: 'Freestyle', label: 'Freestyle' },
    { value: 'Backstroke', label: 'Backstroke' },
    { value: 'Breaststroke', label: 'Breaststroke' },
    { value: 'Butterfly', label: 'Butterfly' },
    { value: 'Individual Medley', label: 'Individual Medley' },
];

// Athletics specific fields
const athleticsCategories = [
    { value: 'Track Events', label: 'Track Events' },
    { value: 'Field Events', label: 'Field Events' },
    { value: 'Road Running', label: 'Road Running' },
    { value: 'Cross Country', label: 'Cross Country' },
];

// Generic sport fields
const genericPositions = [
    { value: 'Player', label: 'Player' },
    { value: 'Captain', label: 'Captain' },
    { value: 'Vice Captain', label: 'Vice Captain' },
];

const genericSkillLevels = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
    { value: 'Expert', label: 'Expert' },
];

export default function RegistrationForm({ config }: { config: RegistrationFormConfig }) {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [fileData, setFileData] = useState<Record<string, File | null>>({});
    const [currentFields, setCurrentFields] = useState<RegistrationField[]>(config.fields);

    // Update fields when config changes
    React.useEffect(() => {
        setCurrentFields(config.fields);

        // Initialize form data with default values
        const initialData: Record<string, any> = {};
        config.fields.forEach(field => {
            if (field.defaultValue !== undefined) {
                initialData[field.name] = field.defaultValue;
            }
        });

        setFormData(prev => ({ ...prev, ...initialData }));
        setErrors({});
        setFileData({});
    }, [config.fields]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        let fieldValue: any;
        if (type === 'checkbox') {
            fieldValue = checked;
        } else if (type === 'radio') {
            fieldValue = value;
        } else {
            fieldValue = value;
        }

        setFormData(prev => ({
            ...prev,
            [name]: fieldValue
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Handle event change
        if (name === 'eventId' && config.onEventChange) {
            config.onEventChange(value);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name } = e.target;
        if (e.target.files && e.target.files[0]) {
            setFileData(prev => ({ ...prev, [name]: e.target.files![0] }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        currentFields.forEach(field => {
            const value = formData[field.name];
            const fileValue = fileData[field.name];

            // Check if field is required (but skip if it's conditional)
            if (field.required && !field.conditional) {
                if (field.type === 'file') {
                    // For file fields, check fileData instead of formData
                    if (!fileValue) {
                        newErrors[field.name] = `${field.label} is required`;
                    }
                } else if (!value || (typeof value === 'string' && !value.trim())) {
                    newErrors[field.name] = `${field.label} is required`;
                }
            }

            // Check conditional fields
            if (field.conditional) {
                const conditionalValue = formData[field.conditional.field];
                let conditionMet = false;

                if (Array.isArray(field.conditional.value)) {
                    // Handle array of values
                    conditionMet = field.conditional.value.includes(conditionalValue);
                } else {
                    // Handle single value
                    conditionMet = conditionalValue === field.conditional.value;
                }

                if (conditionMet) {
                    // For conditional fields, they should be required when the condition is met
                    // regardless of the required flag (since they're mutually exclusive)
                    if (field.type === 'file') {
                        if (!fileValue) {
                            newErrors[field.name] = `${field.label} is required`;
                        }
                    } else if (!value || (typeof value === 'string' && !value.trim())) {
                        newErrors[field.name] = `${field.label} is required`;
                    }
                }
            }

            // Custom validation
            if (field.validation && value) {
                const validationError = field.validation(value);
                if (validationError) {
                    newErrors[field.name] = validationError;
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            await config.onSubmit({ ...formData, ...fileData });
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    const renderField = (field: RegistrationField) => {
        const value = formData[field.name] || '';
        const error = errors[field.name];

        // Check conditional rendering
        if (field.conditional) {
            const conditionalValue = formData[field.conditional.field];
            if (Array.isArray(field.conditional.value)) {
                // Handle array of values
                if (!field.conditional.value.includes(conditionalValue)) {
                    return null;
                }
            } else {
                // Handle single value
                if (conditionalValue !== field.conditional.value) {
                    return null;
                }
            }
        }

        switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'number':
                return (
                    <Input
                        key={field.name}
                        label={field.label}
                        name={field.name}
                        type={field.type}
                        value={value}
                        onChange={handleInputChange}
                        error={error}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                );

            case 'textarea':
                return (
                    <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            name={field.name}
                            value={value}
                            onChange={handleInputChange}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            required={field.required}
                        />
                        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'select':
                return (
                    <Select
                        key={field.name}
                        label={field.label}
                        name={field.name}
                        value={value}
                        onChange={handleInputChange}
                        options={field.options || []}
                        error={error}
                        required={field.required}
                    />
                );

            case 'checkbox':
                return (
                    <label key={field.name} className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name={field.name}
                            checked={value}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </span>
                    </label>
                );

            case 'radio':
                return (
                    <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="space-y-2">
                            {field.options?.map(option => (
                                <label key={option.value} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name={field.name}
                                        value={option.value}
                                        checked={value === option.value}
                                        onChange={handleInputChange}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm">{option.label}</span>
                                </label>
                            ))}
                        </div>
                        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'file':
                return (
                    <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="file"
                            name={field.name}
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            required={field.required}
                        />
                        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Card title={config.title}>
            {config.description && (
                <p className="text-gray-600 mb-6">{config.description}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {currentFields.map(field => renderField(field))}

                <div className="flex justify-end space-x-4">
                    {config.onCancel && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={config.onCancel}
                        >
                            {config.cancelText || 'Cancel'}
                        </Button>
                    )}
                    <Button
                        type="submit"
                        variant="primary"
                        loading={config.loading}
                    >
                        {config.submitText || 'Submit'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}

// Function to get dynamic fields based on event type
export const getEventFields = (eventType: string, eventData?: any): RegistrationField[] => {
    const baseFields: RegistrationField[] = [
        {
            name: 'eventId',
            label: 'Select Event',
            type: 'select' as const,
            required: true,
            options: eventData?.events || [],
            defaultValue: eventData?.preselectedEventId || undefined
        },
        {
            name: 'name',
            label: 'Full Name',
            type: 'text' as const,
            required: true,
            placeholder: 'Enter your full name'
        },
        {
            name: 'contactNo',
            label: 'Contact Number',
            type: 'tel' as const,
            required: true,
            placeholder: 'Enter your contact number'
        },
        {
            name: 'isHikmahStudent',
            label: 'Are you a student at Hikmah Institute?',
            type: 'select' as const,
            required: true,
            options: [
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' }
            ]
        },
        {
            name: 'courseEnrolled',
            label: 'Course Enrolled',
            type: 'select' as const,
            required: true,
            options: courseOptions,
            conditional: {
                field: 'isHikmahStudent',
                value: 'true'
            }
        },
        {
            name: 'darseNizamiYear',
            label: 'In which year of Darse Nizami You are currently studying?',
            type: 'select' as const,
            required: false,
            options: darseNizamiYears,
            conditional: {
                field: 'courseEnrolled',
                value: 'Darse Nizami'
            }
        },
        {
            name: 'currentCourseYear',
            label: 'In which year of course You are currently studying?',
            type: 'select' as const,
            required: false,
            options: courseYears,
            conditional: {
                field: 'courseEnrolled',
                value: 'QS / QHD / Pre Oula'
            }
        },
        {
            name: 'timings',
            label: 'What are your timings?',
            type: 'select' as const,
            // required: true,
            options: timingOptions,
            conditional: {
                field: 'courseEnrolled',
                value: ['QS / QHD / Pre Oula', 'Darse Nizami']
            }
        }
    ];

    // Add sport-specific fields based on event sport type
    switch (eventType) {
        case 'cricket':
            baseFields.push(
                {
                    name: 'playBothTournaments',
                    label: 'Will You play both the tournaments as discussed in HSL group?',
                    type: 'select' as const,
                    required: true,
                    options: [
                        { value: 'yes', label: "Yeah, I'm in :)" },
                        { value: 'auction_only', label: 'Only auction based one.' }
                    ]
                },
                {
                    name: 'type',
                    label: 'Player Type',
                    type: 'select' as const,
                    required: true,
                    options: playerTypes
                },
                {
                    name: 'skillLevel',
                    label: 'Your skill level',
                    type: 'select' as const,
                    required: true,
                    options: skillLevelStars
                },
                {
                    name: 'iconPlayerRequest',
                    label: 'Do you want to be an icon player? (captain)',
                    type: 'select' as const,
                    required: true,
                    options: [
                        { value: 'yes', label: "Yess, I will be." },
                        { value: 'no', label: "No, I'll play as a normal player." }
                    ]
                },
                {
                    name: 'selfAssignedCategory',
                    label: 'Which category best suits you.',
                    type: 'select' as const,
                    required: true,
                    options: categoryOptions
                }
            );
            break;

        case 'football':
            baseFields.push(
                {
                    name: 'position',
                    label: 'Preferred Position',
                    type: 'select' as const,
                    required: true,
                    options: footballPositions
                },
                {
                    name: 'skillLevel',
                    label: 'Your skill level',
                    type: 'select' as const,
                    required: true,
                    options: footballSkillLevels
                },
                {
                    name: 'experience',
                    label: 'Years of Experience',
                    type: 'select' as const,
                    required: true,
                    options: [
                        { value: '0-1', label: '0-1 years' },
                        { value: '2-3', label: '2-3 years' },
                        { value: '4-5', label: '4-5 years' },
                        { value: '5+', label: '5+ years' }
                    ]
                }
            );
            break;

        case 'futsal':
            baseFields.push(
                {
                    name: 'position',
                    label: 'Preferred Position',
                    type: 'select' as const,
                    required: true,
                    options: futsalPositions
                },
                {
                    name: 'skillLevel',
                    label: 'Your skill level',
                    type: 'select' as const,
                    required: true,
                    options: footballSkillLevels
                }
            );
            break;

        case 'cycling':
            baseFields.push(
                {
                    name: 'category',
                    label: 'Cycling Category',
                    type: 'select' as const,
                    required: true,
                    options: cyclingCategories
                },
                {
                    name: 'skillLevel',
                    label: 'Your skill level',
                    type: 'select' as const,
                    required: true,
                    options: genericSkillLevels
                }
            );
            break;

        case 'padel':
            baseFields.push(
                {
                    name: 'position',
                    label: 'Preferred Position',
                    type: 'select' as const,
                    required: true,
                    options: padelPositions
                },
                {
                    name: 'skillLevel',
                    label: 'Your skill level',
                    type: 'select' as const,
                    required: true,
                    options: genericSkillLevels
                }
            );
            break;

        case 'badminton':
            baseFields.push(
                {
                    name: 'category',
                    label: 'Badminton Category',
                    type: 'select' as const,
                    required: true,
                    options: badmintonCategories
                },
                {
                    name: 'skillLevel',
                    label: 'Your skill level',
                    type: 'select' as const,
                    required: true,
                    options: genericSkillLevels
                }
            );
            break;

        case 'tennis':
            baseFields.push(
                {
                    name: 'category',
                    label: 'Tennis Category',
                    type: 'select' as const,
                    required: true,
                    options: tennisCategories
                },
                {
                    name: 'skillLevel',
                    label: 'Your skill level',
                    type: 'select' as const,
                    required: true,
                    options: genericSkillLevels
                }
            );
            break;

        case 'basketball':
            baseFields.push(
                {
                    name: 'position',
                    label: 'Preferred Position',
                    type: 'select' as const,
                    required: true,
                    options: basketballPositions
                },
                {
                    name: 'skillLevel',
                    label: 'Your skill level',
                    type: 'select' as const,
                    required: true,
                    options: genericSkillLevels
                }
            );
            break;

        case 'volleyball':
            baseFields.push(
                {
                    name: 'position',
                    label: 'Preferred Position',
                    type: 'select' as const,
                    required: true,
                    options: volleyballPositions
                },
                {
                    name: 'skillLevel',
                    label: 'Your skill level',
                    type: 'select' as const,
                    required: true,
                    options: genericSkillLevels
                }
            );
            break;

        case 'swimming':
            baseFields.push(
                {
                    name: 'category',
                    label: 'Swimming Category',
                    type: 'select' as const,
                    required: true,
                    options: swimmingCategories
                },
                {
                    name: 'skillLevel',
                    label: 'Your skill level',
                    type: 'select' as const,
                    required: true,
                    options: genericSkillLevels
                }
            );
            break;

        case 'athletics':
            baseFields.push(
                {
                    name: 'category',
                    label: 'Athletics Category',
                    type: 'select' as const,
                    required: true,
                    options: athleticsCategories
                },
                {
                    name: 'skillLevel',
                    label: 'Your skill level',
                    type: 'select' as const,
                    required: true,
                    options: genericSkillLevels
                }
            );
            break;

        case 'academic':
            baseFields.push(
                {
                    name: 'subject',
                    label: 'Subject/Field of Study',
                    type: 'text' as const,
                    required: true,
                    placeholder: 'Enter your subject or field of study'
                },
                {
                    name: 'level',
                    label: 'Academic Level',
                    type: 'select' as const,
                    required: true,
                    options: [
                        { value: 'Undergraduate', label: 'Undergraduate' },
                        { value: 'Graduate', label: 'Graduate' },
                        { value: 'PhD', label: 'PhD' },
                        { value: 'Post-Doc', label: 'Post-Doc' },
                        { value: 'Faculty', label: 'Faculty' }
                    ]
                }
            );
            break;

        default:
            // Generic sport/activity fields
            baseFields.push(
                {
                    name: 'position',
                    label: 'Role/Position',
                    type: 'select' as const,
                    required: true,
                    options: genericPositions
                },
                {
                    name: 'skillLevel',
                    label: 'Your skill level',
                    type: 'select' as const,
                    required: true,
                    options: genericSkillLevels
                }
            );
            break;
    }

    // Add common fields
    baseFields.push(
        {
            name: 'paymentMethod',
            label: `The contribution per player will be around ${eventData?.pricePerPerson || '800 - 1200'} Rs.`,
            type: 'select' as const,
            required: true,
            options: paymentOptions
        },
        {
            name: 'assurance',
            label: 'I assure that I\'ll reach on time and will not cause any trouble for other players.',
            type: 'checkbox' as const,
            required: true
        },
        {
            name: 'photo',
            label: 'Player Photo',
            type: 'file' as const,
            required: true
        }
    );

    return baseFields;
};

// Predefined field configurations for common use cases
export const fieldConfigs = {
    // Dynamic event registration fields
    eventRegistration: (eventType: string, eventData?: any) => getEventFields(eventType, eventData),

    // Basic event registration fields (for non-sport events)
    basicEventRegistration: [
        {
            name: 'eventId',
            label: 'Select Event',
            type: 'select' as const,
            required: true,
            options: []
        },
        {
            name: 'name',
            label: 'Full Name',
            type: 'text' as const,
            required: true,
            placeholder: 'Enter your full name'
        },
        {
            name: 'phone',
            label: 'Phone Number (WhatsApp)',
            type: 'tel' as const,
            required: true,
            placeholder: 'Enter your phone number'
        },
        {
            name: 'department',
            label: 'Department',
            type: 'text' as const,
            required: true,
            placeholder: 'Enter your department'
        },
        {
            name: 'teamName',
            label: 'Team Name',
            type: 'text' as const,
            required: false,
            placeholder: 'Enter team name'
        },
        {
            name: 'teamMembers',
            label: 'Team Members (comma-separated)',
            type: 'textarea' as const,
            required: false,
            placeholder: 'Enter team member names separated by commas'
        },
        {
            name: 'specialRequirements',
            label: 'Special Requirements or Notes',
            type: 'textarea' as const,
            required: false,
            placeholder: 'Any special dietary requirements, accessibility needs, etc.'
        }
    ]
};
