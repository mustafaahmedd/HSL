'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Button, Input, Select } from '@/components/ui';
import { ITournament } from '@/types/Tournament';

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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournament');

  const [loading, setLoading] = useState(false);
  const [tournament, setTournament] = useState<ITournament | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactNo: '',
    isHikmahStudent: false,
    courseEnrolled: '',
    darseNizamiYear: '',
    currentCourseYear: '',
    timings: '',
    playBothTournaments: false,
    skillLevel: '',
    iconPlayerRequest: false,
    selfAssignedCategory: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
    }
  }, [tournamentId]);

  const fetchTournament = async () => {
    try {
      const response = await fetch('/api/admin/config');
      const data = await response.json();
      if (data.success) {
        const found = data.tournaments.find((t: ITournament) => t._id?.toString() === tournamentId);
        if (found) {
          setTournament(found);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tournament:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.contactNo.trim()) newErrors.contactNo = 'Contact number is required';
    if (!formData.timings) newErrors.timings = 'Timing preference is required';
    if (!formData.skillLevel) newErrors.skillLevel = 'Skill level is required';
    if (!formData.selfAssignedCategory) newErrors.selfAssignedCategory = 'Category is required';
    if (!photoFile) newErrors.photo = 'Photo is required';

    if (formData.isHikmahStudent && !formData.courseEnrolled) {
      newErrors.courseEnrolled = 'Course information is required for Hikmah students';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const submitData = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value.toString());
      });

      // Add photo
      if (photoFile) {
        submitData.append('photo', photoFile);
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (data.success) {
        router.push('/register/success');
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card title="Player Registration Form">
          {tournament && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">Tournament: {tournament.name}</h3>
              <p className="text-sm text-blue-700">Start Date: {new Date(tournament.startDate).toLocaleDateString()}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Player Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={errors.name}
                required
              />

              <Input
                label="Contact Number"
                name="contactNo"
                type="tel"
                value={formData.contactNo}
                onChange={handleInputChange}
                error={errors.contactNo}
                required
              />
            </div>

            {/* Hikmah Student Information */}
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isHikmahStudent"
                  checked={formData.isHikmahStudent}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Are you a student at Hikmah Institute?</span>
              </label>

              {formData.isHikmahStudent && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                  <Input
                    label="Course Enrolled"
                    name="courseEnrolled"
                    value={formData.courseEnrolled}
                    onChange={handleInputChange}
                    error={errors.courseEnrolled}
                  />

                  <Input
                    label="Darse Nizami Year"
                    name="darseNizamiYear"
                    value={formData.darseNizamiYear}
                    onChange={handleInputChange}
                  />

                  <Input
                    label="Current Course Year"
                    name="currentCourseYear"
                    value={formData.currentCourseYear}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>

            {/* Tournament Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Preferred Timings"
                name="timings"
                value={formData.timings}
                onChange={handleInputChange}
                options={timingOptions}
                error={errors.timings}
              />

              <Select
                label="Skill Level"
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleInputChange}
                options={skillLevels}
                error={errors.skillLevel}
              />
            </div>

            {/* Category Selection */}
            <Select
              label="Self-Assigned Category"
              name="selfAssignedCategory"
              value={formData.selfAssignedCategory}
              onChange={handleInputChange}
              options={categories}
              error={errors.selfAssignedCategory}
            />

            {/* Additional Options */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="playBothTournaments"
                  checked={formData.playBothTournaments}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Play both tournaments</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="iconPlayerRequest"
                  checked={formData.iconPlayerRequest}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Icon player request</span>
              </label>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Player Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {errors.photo && (
                <p className="mt-1 text-sm text-red-600">{errors.photo}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/')}
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
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
