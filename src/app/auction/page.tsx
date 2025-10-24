'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { IAuction } from '@/types/Auction';

export default function AuctionList() {
    const [loading, setLoading] = useState(true);
    const [auctions, setAuctions] = useState<IAuction[]>([]);

    useEffect(() => {
        fetchAuctions();
    }, []);

    const fetchAuctions = async () => {
        try {
            const response = await fetch('/api/auction');
            const data = await response.json();

            if (data.success) {
                setAuctions(data.auctions);
            }
        } catch (error) {
            console.error('Failed to fetch auctions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-800';
            case 'live': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'upcoming': return '⏰';
            case 'live': return '🔴';
            case 'completed': return '✅';
            case 'cancelled': return '❌';
            default: return '❓';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cricket Player Auctions</h1>
                        <p className="text-gray-600">Join exciting cricket player auctions and build your dream team</p>
                    </div>
                    <Link href="/">
                        <Button variant="secondary">Back to Home</Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{auctions.length}</div>
                        <div className="text-sm text-gray-600">Total Auctions</div>
                    </Card>
                    <Card className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                            {auctions.filter(a => a.status === 'live').length}
                        </div>
                        <div className="text-sm text-gray-600">Live Auctions</div>
                    </Card>
                    <Card className="text-center">
                        <div className="text-3xl font-bold text-yellow-600">
                            {auctions.filter(a => a.status === 'upcoming').length}
                        </div>
                        <div className="text-sm text-gray-600">Upcoming</div>
                    </Card>
                    <Card className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                            PKR {auctions.reduce((sum, a) => sum + a.totalRevenue, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Total Revenue</div>
                    </Card>
                </div>

                {/* Auctions List */}
                {auctions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {auctions.map((auction) => (
                            <Card key={auction._id?.toString()} className="hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{auction.name}</h3>
                                        <p className="text-gray-600 text-sm mb-2">
                                            {(auction.eventId as any)?.name || 'Unknown Event'}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(auction.status)}`}>
                                        {getStatusIcon(auction.status)} {auction.status}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Date:</span>
                                        <span className="font-medium">{new Date(auction.auctionDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Time:</span>
                                        <span className="font-medium">{new Date(auction.auctionDate).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Players:</span>
                                        <span className="font-medium">{auction.players.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Teams:</span>
                                        <span className="font-medium">{auction.teams.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Base Price:</span>
                                        <span className="font-medium">PKR {auction.basePrice.toLocaleString()}</span>
                                    </div>
                                </div>

                                {auction.description && (
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{auction.description}</p>
                                )}

                                <div className="flex gap-2">
                                    {auction.status === 'upcoming' && (
                                        <Link href={`/auction/${auction._id}/register`} className="flex-1">
                                            <Button variant="primary" className="w-full">Register Team</Button>
                                        </Link>
                                    )}
                                    {auction.status === 'live' && (
                                        <Link href={`/auction/${auction._id}/live`} className="flex-1">
                                            <Button variant="primary" className="w-full">Join Live Auction</Button>
                                        </Link>
                                    )}
                                    {auction.status === 'completed' && (
                                        <Link href={`/auction/${auction._id}/live`} className="flex-1">
                                            <Button variant="secondary" className="w-full">View Results</Button>
                                        </Link>
                                    )}
                                    <Link href={`/auction/${auction._id}/live`} className="flex-1">
                                        <Button variant="secondary" className="w-full">View Details</Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-12">
                        <div className="text-6xl mb-4">🏏</div>
                        <h3 className="text-xl font-semibold mb-2">No Auctions Available</h3>
                        <p className="text-gray-600 mb-4">
                            There are currently no cricket player auctions scheduled.
                        </p>
                        <p className="text-sm text-gray-500">
                            Check back later or contact the organizer for upcoming events.
                        </p>
                    </Card>
                )}

                {/* Call to Action */}
                <div className="mt-12 text-center">
                    <Card className="max-w-2xl mx-auto">
                        <div className="py-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Build Your Dream Team?</h2>
                            <p className="text-gray-600 mb-6">
                                Join our cricket player auctions and compete with other teams to build the ultimate squad.
                                Register your team, manage your budget, and bid strategically to win the best players.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/register">
                                    <Button variant="primary">Register as Player</Button>
                                </Link>
                                <Link href="/teams">
                                    <Button variant="secondary">View Teams</Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
