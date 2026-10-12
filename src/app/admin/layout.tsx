'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    HomeIcon,
    CalendarDaysIcon,
    UserIcon,
    ClipboardDocumentListIcon,
    UserGroupIcon,
    TrophyIcon,
    ArrowLeftStartOnRectangleIcon,
    ChevronDoubleLeftIcon,
    Bars3Icon,
} from '@heroicons/react/24/outline';

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
        { href: '/admin', label: 'Dashboard', icon: HomeIcon },
        { href: '/admin/events', label: 'Manage Events', icon: CalendarDaysIcon },
        { href: '/admin/players', label: 'Manage Players', icon: UserIcon },
        { href: '/admin/registrations', label: 'Manage Registrations', icon: ClipboardDocumentListIcon },
        { href: '/admin/teams', label: 'Teams', icon: UserGroupIcon },
        { href: '/admin/auction', label: 'Auction Control', icon: TrophyIcon },
    ];

    // `compact` = icon-only rail (desktop collapsed). The mobile drawer always renders full width.
    const renderSidebar = (compact: boolean) => (
        <div className="h-full flex flex-col">
            <div className={`py-4 border-b border-gray-200 flex items-center gap-2 ${compact ? 'justify-center px-2' : 'justify-between px-4'}`}>
                {!compact && (
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-gray-900 truncate">Admin Panel</h2>
                        <p className="text-xs text-gray-500 truncate">Hikmah Student Life</p>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed((v) => !v)}
                    className="hidden md:inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <ChevronDoubleLeftIcon className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = href === '/admin' ? pathname === href : pathname === href || pathname?.startsWith(href + '/');
                    return (
                        <Link
                            key={href}
                            href={href}
                            title={compact ? label : undefined}
                            className={
                                `flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors ` +
                                (compact ? 'justify-center px-2 ' : 'px-3 ') +
                                (active ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100')
                            }
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            {!compact && <span className="truncate">{label}</span>}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-gray-200 p-2">
                <button
                    onClick={() => {
                        if (typeof window !== 'undefined') {
                            localStorage.removeItem('adminToken');
                        }
                        router.push('/admin/login');
                    }}
                    title={compact ? 'Logout' : undefined}
                    className={`flex w-full items-center gap-3 rounded-md py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 ${compact ? 'justify-center px-2' : 'px-3'}`}
                >
                    <ArrowLeftStartOnRectangleIcon className="h-5 w-5 shrink-0" />
                    {!compact && <span>Logout</span>}
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
                    <Bars3Icon className="h-5 w-5" />
                </button>
            </div>

            {/* Layout wrapper - full width, sidebar anchored left */}
            <div className="relative md:flex">
                {/* Static sidebar for md+ */}
                <aside className={`hidden md:block md:sticky md:top-0 md:h-screen ${collapsed ? 'md:w-16' : 'md:w-64'} md:shrink-0 border-r border-gray-200 bg-white shadow-sm transition-[width] duration-200`}>
                    {renderSidebar(collapsed)}
                </aside>

                {/* Drawer for mobile */}
                {mobileOpen && (
                    <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
                        <div className="fixed inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
                        <div className="relative ml-0 h-full w-72 max-w-[85vw] bg-white shadow-xl">
                            {renderSidebar(false)}
                        </div>
                    </div>
                )}

                {/* Main content */}
                {/* min-w-0 lets the flex child shrink, so wide content scrolls inside its own container instead of the page */}
                <main className="min-w-0 flex-1">
                    <div className="px-4 py-6 md:px-8">
                        <div className="mx-auto max-w-7xl">{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}


