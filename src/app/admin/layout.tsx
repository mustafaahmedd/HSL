'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

type AdminLayoutProps = {
    children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const onLoginRoute = pathname?.startsWith('/admin/login');
        const token = localStorage.getItem('adminToken');
        if (!token && !onLoginRoute) {
            const redirectTo = window.location.pathname + window.location.search;
            router.replace(`/admin/login?redirect=${encodeURIComponent(redirectTo)}`);
        }
    }, [pathname, router]);

    // Load/save collapse preference
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem('adminSidebarCollapsed');
        setCollapsed(saved === '1');
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('adminSidebarCollapsed', collapsed ? '1' : '0');
    }, [collapsed]);

    // Close drawer when route changes
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const navItems = [
        { href: '/admin', label: 'Dashboard' },
        { href: '/admin/events', label: 'Manage Events' },
        { href: '/admin/players', label: 'Manage Players' },
        { href: '/admin/registrations', label: 'Manage Registrations' },
        { href: '/admin/teams', label: 'Teams' },
        { href: '/admin/auction', label: 'Auction Control' },
    ];

    const Sidebar = (
        <div className="h-full flex flex-col">
            <div className="px-3 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <h2 className="text-sm md:text-base font-semibold">Admin Panel</h2>
                    <p className="text-[10px] md:text-xs text-gray-500">Hikmah Student Life</p>
                </div>
                <button
                    onClick={() => setCollapsed((v) => !v)}
                    className="hidden md:inline-flex items-center justify-center rounded-md p-1 text-gray-600 hover:bg-gray-100"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                {navItems.map((item) => {
                    const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={
                                `block rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap overflow-hidden ` +
                                (active
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100')
                            }
                        >
                            {collapsed ? (
                                <span
                                    className={`inline-block h-2 w-2 rounded-full ${active ? 'bg-blue-600' : 'bg-gray-400'}`}
                                    title={item.label}
                                />
                            ) : (
                                <span>{item.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-gray-200 p-3">
                <button
                    onClick={() => {
                        if (typeof window !== 'undefined') {
                            localStorage.removeItem('adminToken');
                        }
                        router.push('/admin/login');
                    }}
                    className="w-full rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                    Logout
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile top bar */}
            <div className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 md:hidden">
                <div className="font-semibold">Admin</div>
                <button
                    aria-label="Toggle navigation"
                    onClick={() => setMobileOpen((v) => !v)}
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 shadow-sm focus:outline-none"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Layout wrapper - full width, sidebar anchored left */}
            <div className="relative md:flex">
                {/* Static sidebar for md+ */}
                <aside className={`hidden md:block md:sticky md:top-0 md:h-screen ${collapsed ? 'md:w-14' : 'md:w-64'} md:shrink-0 border-r border-gray-200 bg-white shadow-sm`}
                    style={{ contain: 'size layout' }}>
                    <div className="h-full">{Sidebar}</div>
                </aside>

                {/* Drawer for mobile */}
                {mobileOpen && (
                    <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
                        <div className="fixed inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
                        <div className="relative ml-0 h-full w-72 bg-white shadow-xl">
                            {Sidebar}
                        </div>
                    </div>
                )}

                {/* Main content */}
                <main className="w-full md:flex-1">
                    <div className="px-4 py-6 md:px-8">
                        <div className="mx-auto max-w-7xl">{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}


