'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input } from '@/components/ui';

function AdminLoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('adminToken', data.token);
                const redirect = params.get('redirect') || '/admin';
                router.replace(redirect);
            } else {
                setLoginError(data.error || 'Login failed');
            }
        } catch (err) {
            setLoginError('Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <Card className="max-w-md w-full" title="Admin Login">
                <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                        label="Username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                    />
                    {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
                    <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
                <div className="mt-4 flex justify-center">
                    <Link href="/" className="text-blue-600 hover:underline">
                        ← Back to Home
                    </Link>
                </div>
            </Card>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <Card className="max-w-md w-full" title="Admin Login">
                    <div className="text-center py-8">Loading...</div>
                </Card>
            </div>
        }>
            <AdminLoginForm />
        </Suspense>
    );
}


