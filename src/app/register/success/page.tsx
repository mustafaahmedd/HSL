'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';

export default function RegistrationSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Successful!
          </h2>
          <p className="text-gray-600">
            Your registration has been submitted successfully. You will be contacted by the admin with further details.
          </p>
        </div>
        <Link href="/">
          <Button variant="primary" className="w-full">
            Back to Home
          </Button>
        </Link>
      </Card>
    </div>
  );
}
