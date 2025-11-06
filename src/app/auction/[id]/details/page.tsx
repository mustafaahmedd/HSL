'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { IAuction } from '@/types/Auction';

export default function PublicAuctionDetails() {
    const params = useParams();
    const auctionId = params.id as string;

    const [auction, setAuction] = useState<IAuction | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [currentPlayer, setCurrentPlayer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [availableCategoryPlayers, setAvailableCategoryPlayers] = useState<any[]>([]);
    const [targetTime] = useState(new Date('2025-11-06T17:00:00').getTime());
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
    const [timerExpired, setTimerExpired] = useState(false);

    // TESTING FLAGS - Set these to test different conditions
    const [forceTimerExpired, setForceTimerExpired] = useState(true); // Set to true to test post-timer functionality
    const [showTestControls, setShowTestControls] = useState(true);

    // Notification popup state
    const [showNotification, setShowNotification] = useState(false);
    const [notificationData, setNotificationData] = useState<{
        playerName: string;
        teamName: string;
        bidPrice: number;
    } | null>(null);

    // Track processed assignments to avoid duplicate notifications
    const [processedAssignments, setProcessedAssignments] = useState<Set<string>>(new Set());

    // Timer countdown effect
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = targetTime - now;

            if (distance < 0 || forceTimerExpired) {
                setTimerExpired(true);
                setTimeLeft(null);
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                setTimeLeft({ days, hours, minutes, seconds });
                setTimerExpired(false);
            }
        };

        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);

        return () => clearInterval(timerInterval);
    }, [targetTime, forceTimerExpired]);

    useEffect(() => {
        if (auctionId) {
            fetchAuctionDetails();

            // Set up polling for live auctions (only if timer expired)
            const interval = setInterval(() => {
                if (auction?.status === 'live' && (timerExpired || forceTimerExpired)) {
                    fetchAuctionDetails();
                }
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [auctionId, auction?.status, timerExpired, forceTimerExpired]);

    const fetchAuctionDetails = async () => {
        try {
            if (!auction) setLoading(true); // Only show loading on first load

            const response = await fetch(`/api/auction/${auctionId}/public`);
            const data = await response.json();

            if (data.success) {
                setAuction(data.auction);
                setStats(data.stats);
                setSession(data.session);

                // Handle recent assignment notifications (only if timer expired or forced)
                if (data.recentAssignment && (timerExpired || forceTimerExpired)) {
                    const assignmentId = `${data.recentAssignment.playerId}_${data.recentAssignment.transactionDate}`;

                    if (!processedAssignments.has(assignmentId)) {
                        // Show assignment notification
                        setNotificationData({
                            playerName: data.recentAssignment.playerName,
                            teamName: data.recentAssignment.teamName,
                            bidPrice: data.recentAssignment.bidPrice
                        });
                        setShowNotification(true);

                        // Mark this assignment as processed
                        setProcessedAssignments(prev => new Set([...prev, assignmentId]));

                        // Hide notification after 3 seconds
                        setTimeout(() => {
                            setShowNotification(false);
                            setNotificationData(null);
                        }, 5000);
                    }
                }

                // Set current player only if timer expired or forced
                if ((timerExpired || forceTimerExpired) && data.session?.currentPlayerId) {
                    setCurrentPlayer(data.session.currentPlayerId);

                    // Update available players for current player's category
                    if (data.session.currentPlayerId?.approvedCategory && data.auction) {
                        const category = data.session.currentPlayerId.approvedCategory;
                        const available = data.auction.players.filter((p: any) =>
                            p.approvedCategory === category &&
                            !p.teamId &&
                            !p.approvedIconPlayer
                        );

                        // Sort: Mustafa first (case-insensitive), then rest in original order
                        const sorted = [...available].sort((a: any, b: any) => {
                            const aName = (a.name || '').toLowerCase();
                            const bName = (b.name || '').toLowerCase();
                            const aHasMustafa = aName.includes('mustafa');
                            const bHasMustafa = bName.includes('mustafa');

                            if (aHasMustafa && !bHasMustafa) return -1;
                            if (!aHasMustafa && bHasMustafa) return 1;
                            return 0;
                        });

                        setAvailableCategoryPlayers(sorted);
                    } else {
                        setAvailableCategoryPlayers([]);
                    }
                } else if (!timerExpired && !forceTimerExpired) {
                    setCurrentPlayer(null);
                    setAvailableCategoryPlayers([]);
                }
            } else {
                setError(data.error || 'Failed to fetch auction details');
            }
        } catch (error) {
            console.error('Failed to fetch auction details:', error);
            setError('Failed to fetch auction details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Link href="/auction">
                        <Button variant="primary">Back to Auctions</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!auction) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Auction Not Found</h2>
                    <Link href="/auction">
                        <Button variant="primary">Back to Auctions</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Category configuration for pricing
    const getCategoryConfig = (categoryName: string) => {
        const CATEGORY_CONFIG = [
            { name: 'Platinum', minBidPrice: 4000, bidIncrement: 400, color: 'purple' },
            { name: 'Diamond', minBidPrice: 2500, bidIncrement: 200, color: 'blue' },
            { name: 'Gold', minBidPrice: 1000, bidIncrement: 100, color: 'yellow' },
        ];
        return CATEGORY_CONFIG.find(cat => cat.name === categoryName) || CATEGORY_CONFIG[CATEGORY_CONFIG.length - 1];
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            {/* Assignment Notification Popup */}
            {showNotification && notificationData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform animate-bounce-in">
                        <div className="text-center">
                            <div className="mb-4 animate-bounce">
                                <span className="text-6xl">🎉</span>
                            </div>
                            <h2 className="text-2xl font-bold text-green-600 mb-4">
                                Player Sold!
                            </h2>
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-4">
                                <p className="text-lg font-semibold text-gray-900 mb-2">
                                    {notificationData.playerName}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Purchased by <span className="font-bold text-blue-600">{notificationData.teamName}</span>
                                </p>
                                <p className="text-xl font-bold text-green-600 mt-2">
                                    PKR {notificationData.bidPrice.toLocaleString()}
                                </p>
                            </div>
                            <p className="text-xs text-gray-500">
                                Next player loading...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{auction.name}</h1>
                        <p className="text-gray-600">{(auction.eventId as any)?.title}</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${auction.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            auction.status === 'live' ? 'bg-green-100 text-green-800' :
                                auction.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                            }`}>
                            {auction.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <Link href="/auction">
                            <Button variant="secondary" className="w-full sm:w-auto">Back to Auctions</Button>
                        </Link>
                    </div>
                </div>

                {/* Testing Controls - Remove in production */}
                {showTestControls && (
                    <Card className="mb-6 border-2 border-yellow-400 bg-yellow-50">
                        <div className="p-4">
                            <h3 className="text-lg font-bold text-yellow-800 mb-3">🧪 TESTING CONTROLS</h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setForceTimerExpired(!forceTimerExpired)}
                                    className={`px-4 py-2 rounded font-medium ${forceTimerExpired
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    {forceTimerExpired ? '✅ Timer Forced Expired' : '⏸️ Force Timer Expired'}
                                </button>
                                <button
                                    onClick={() => setShowTestControls(false)}
                                    className="px-4 py-2 bg-red-500 text-white rounded font-medium"
                                >
                                    🚫 Hide Controls
                                </button>
                                <div className="flex items-center text-sm text-yellow-700">
                                    Status: {timerExpired || forceTimerExpired ? 'POST-TIMER' : 'PRE-TIMER'}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Timer Display */}
                {auction.status === 'live' && !timerExpired && !forceTimerExpired && timeLeft && (
                    <Card className="mb-6">
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-center text-blue-600 mb-4">⏰ AUCTION STARTS IN</h3>
                            <div className="flex justify-center space-x-4 mb-4">
                                <div className="text-center">
                                    <div className="bg-blue-600 text-white rounded-lg p-4 min-w-[80px]">
                                        <div className="text-2xl font-bold">{timeLeft.days}</div>
                                        <div className="text-sm">Days</div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="bg-blue-600 text-white rounded-lg p-4 min-w-[80px]">
                                        <div className="text-2xl font-bold">{timeLeft.hours}</div>
                                        <div className="text-sm">Hours</div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="bg-blue-600 text-white rounded-lg p-4 min-w-[80px]">
                                        <div className="text-2xl font-bold">{timeLeft.minutes}</div>
                                        <div className="text-sm">Minutes</div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="bg-blue-600 text-white rounded-lg p-4 min-w-[80px]">
                                        <div className="text-2xl font-bold">{timeLeft.seconds}</div>
                                        <div className="text-sm">Seconds</div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-center text-gray-600">Thursday, November 6, 2025 at 5:00 PM</p>
                        </div>
                    </Card>
                )}
                {/* Current Player Display for Live Auctions (only after timer expires) */}
                {auction.status === 'live' && (timerExpired || forceTimerExpired) && currentPlayer && (
                    <Card className="mb-6" id="current-player-display">
                        <div className="p-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">🔴 LIVE AUCTION - CURRENT PLAYER</h3>

                            {/* Player Display */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200 shadow-md">
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    {/* Profile Picture */}
                                    <div className="relative">
                                        <img
                                            src={currentPlayer.photoUrl || '/placeholder-avatar.png'}
                                            alt={currentPlayer.name}
                                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                                        />
                                        <span className={`absolute -top-2 -right-2 px-2 py-1 text-xs font-bold rounded-full shadow-lg ${currentPlayer.approvedCategory === 'Platinum' ? 'bg-purple-500 text-white' :
                                            currentPlayer.approvedCategory === 'Diamond' ? 'bg-blue-500 text-white' :
                                                currentPlayer.approvedCategory === 'Gold' ? 'bg-yellow-500 text-white' :
                                                    'bg-gray-500 text-white'
                                            }`}>
                                            {currentPlayer.approvedCategory}
                                        </span>
                                    </div>

                                    {/* Player Info */}
                                    <div className="flex-1 text-center md:text-left">
                                        <h4 className="text-2xl font-bold text-gray-900 mb-2">{currentPlayer.name}</h4>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-2 text-sm text-gray-600 mb-4">
                                            <span className="flex items-center gap-1 bg-white px-2 py-1 rounded">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {currentPlayer.playerRole || 'Player'}
                                            </span>
                                            {currentPlayer.skillLevel && (
                                                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    {currentPlayer.skillLevel} stars
                                                </span>
                                            )}
                                        </div>

                                        {/* Pricing Details */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                                <div className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Base Price</div>
                                                <div className="text-lg font-bold text-green-700">PKR {getCategoryConfig(currentPlayer.approvedCategory || 'Gold').minBidPrice.toLocaleString()}</div>
                                            </div>
                                            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Bid Increment</div>
                                                <div className="text-lg font-bold text-blue-700">PKR {getCategoryConfig(currentPlayer.approvedCategory || 'Gold').bidIncrement.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card className="text-center">
                            <div className="text-3xl font-bold text-blue-600">{stats.totalPlayers}</div>
                            <div className="text-sm text-gray-600">Total Players</div>
                        </Card>
                        <Card className="text-center">
                            <div className="text-3xl font-bold text-green-600">{stats.playersSold}</div>
                            <div className="text-sm text-gray-600">Players Sold</div>
                        </Card>
                        <Card className="text-center">
                            <div className="text-3xl font-bold text-yellow-600">{stats.playersAvailable}</div>
                            <div className="text-sm text-gray-600">Available</div>
                        </Card>
                        <Card className="text-center">
                            <div className="text-3xl font-bold text-purple-600">PKR {stats.totalRevenue}</div>
                            <div className="text-sm text-gray-600">Total Revenue</div>
                        </Card>
                    </div>
                )}
                {/* Auction Details */}
                {(auction.status === 'live' || auction.status === 'completed') && auction.teams.length > 0 ? (
                    <Card className="mb-8">
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">AUCTION DETAILS</h3>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        const printContent = document.getElementById('public-auction-details-table');
                                        if (printContent) {
                                            const printWindow = window.open('', '_blank');
                                            if (printWindow) {
                                                printWindow.document.write(`
                                                    <html>
                                                        <head>
                                                            <title>Auction Details - ${auction.name}</title>
                                                            <style>
                                                                @media print {
                                                                    * {
                                                                        -webkit-print-color-adjust: exact !important;
                                                                        color-adjust: exact !important;
                                                                        print-color-adjust: exact !important;
                                                                    }
                                                                }
                                                                body { 
                                                                    font-family: Arial, sans-serif; 
                                                                    padding: 20px; 
                                                                    margin: 0;
                                                                }
                                                                table { 
                                                                    width: 100%; 
                                                                    border-collapse: collapse; 
                                                                    margin-bottom: 30px; 
                                                                    border: 2px solid #000;
                                                                }
                                                                th { 
                                                                    background-color: #2563eb !important; 
                                                                    color: white !important; 
                                                                    padding: 12px; 
                                                                    text-align: left; 
                                                                    font-weight: bold; 
                                                                    border: 1px solid #000;
                                                                    -webkit-print-color-adjust: exact;
                                                                }
                                                                td { 
                                                                    padding: 10px; 
                                                                    border: 1px solid #000; 
                                                                    font-size: 12px;
                                                                }
                                                                .bg-blue-50 { 
                                                                    background-color: #dbeafe !important; 
                                                                    -webkit-print-color-adjust: exact;
                                                                }
                                                                .bg-purple-50 { 
                                                                    background-color: #f3e8ff !important; 
                                                                    -webkit-print-color-adjust: exact;
                                                                }
                                                                .bg-gray-100 { 
                                                                    background-color: #f3f4f6 !important; 
                                                                    -webkit-print-color-adjust: exact;
                                                                }
                                                                .bg-blue-600 { 
                                                                    background-color: #2563eb !important; 
                                                                    color: white !important;
                                                                    -webkit-print-color-adjust: exact;
                                                                }
                                                                .text-blue-700 { color: #1d4ed8 !important; }
                                                                .text-purple-700 { color: #7c3aed !important; }
                                                                .text-green-600 { color: #059669 !important; }
                                                                .text-red-600 { color: #dc2626 !important; }
                                                                .bg-purple-100 { 
                                                                    background-color: #e9d5ff !important; 
                                                                    color: #7c3aed !important;
                                                                    -webkit-print-color-adjust: exact;
                                                                }
                                                                .bg-blue-100 { 
                                                                    background-color: #dbeafe !important; 
                                                                    color: #1d4ed8 !important;
                                                                    -webkit-print-color-adjust: exact;
                                                                }
                                                                .bg-yellow-100 { 
                                                                    background-color: #fef3c7 !important; 
                                                                    color: #d97706 !important;
                                                                    -webkit-print-color-adjust: exact;
                                                                }
                                                                .font-bold { font-weight: bold; }
                                                                .font-semibold { font-weight: 600; }
                                                                .text-center { text-align: center; }
                                                                .text-right { text-align: right; }
                                                                .px-2 { padding-left: 8px; padding-right: 8px; }
                                                                .py-1 { padding-top: 4px; padding-bottom: 4px; }
                                                                .rounded { border-radius: 4px; }
                                                            </style>
                                                        </head>
                                                        <body>
                                                            <h1 style="text-align: center; margin-bottom: 20px;">Auction Details - ${auction.name}</h1>
                                                            ${printContent.innerHTML}
                                                        </body>
                                                    </html>
                                                `);
                                                printWindow.document.close();
                                                printWindow.print();
                                            }
                                        }
                                    }}
                                >
                                    📄 Print / Export
                                </Button>
                            </div>

                            <div id="public-auction-details-table" className="overflow-x-auto">
                                {auction.teams.map((team: any) => {
                                    // Sort players by transaction date (chronological order)
                                    const sortedPlayers = [...(team.players || [])].sort((a: any, b: any) => {
                                        const dateA = new Date(a.transactionDate || 0).getTime();
                                        const dateB = new Date(b.transactionDate || 0).getTime();
                                        return dateA - dateB;
                                    });

                                    // Calculate running totals
                                    let runningPointsLeft = team.totalPoints || 0;

                                    return (
                                        <div key={team._id?.toString()} className="mb-8">
                                            <table className="min-w-full border border-gray-300 mb-4">
                                                <thead>
                                                    <tr className="bg-blue-600 text-white">
                                                        <th colSpan={8} className="text-center py-3 text-lg font-bold">
                                                            {team.title}
                                                        </th>
                                                    </tr>
                                                    <tr className="bg-gray-100">
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">#</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Player Name</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Type</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Category</th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Total Points</th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Points Spent</th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Points Left</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Contact No</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* Owner Row */}
                                                    <tr className="bg-blue-50">
                                                        <td className="px-4 py-3 font-medium">1</td>
                                                        <td className="px-4 py-3 font-semibold">{team.owner ? `${team.owner} (O)` : '-'}</td>
                                                        <td className="px-4 py-3">-</td>
                                                        <td className="px-4 py-3 font-semibold text-blue-700">Owner</td>
                                                        <td className="px-4 py-3 text-right font-bold">{team.totalPoints?.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right">-</td>
                                                        <td className="px-4 py-3 text-right font-bold text-green-600">{team.totalPoints?.toLocaleString()}</td>
                                                        <td className="px-4 py-3">-</td>
                                                    </tr>

                                                    {/* Captain Row */}
                                                    {team.captain && (
                                                        <tr className="bg-purple-50">
                                                            <td className="px-4 py-3 font-medium">2</td>
                                                            <td className="px-4 py-3 font-semibold">{team.captain}</td>
                                                            <td className="px-4 py-3">-</td>
                                                            <td className="px-4 py-3 font-semibold text-purple-700">Captain</td>
                                                            <td className="px-4 py-3 text-right font-bold">{runningPointsLeft.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-right">0</td>
                                                            <td className="px-4 py-3 text-right font-bold text-green-600">{runningPointsLeft.toLocaleString()}</td>
                                                            <td className="px-4 py-3">-</td>
                                                        </tr>
                                                    )}

                                                    {/* Players Rows */}
                                                    {sortedPlayers.map((player: any, index: number) => {
                                                        const purchasePrice = player.purchasePrice || 0;
                                                        const pointsBeforePurchase = runningPointsLeft;
                                                        runningPointsLeft -= purchasePrice;
                                                        const rowNumber = team.captain ? index + 3 : index + 2;

                                                        return (
                                                            <tr key={player.registrationId?.toString() || index} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3 font-medium">{rowNumber}</td>
                                                                <td className="px-4 py-3 font-semibold">{player.playerName || '-'}</td>
                                                                <td className="px-4 py-3">{player.playerRole || '-'}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${player.category === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                                                                        player.category === 'Diamond' ? 'bg-blue-100 text-blue-700' :
                                                                            player.category === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                                                                                'bg-gray-100 text-gray-700'
                                                                        }`}>
                                                                        {player.category || '-'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-bold">{pointsBeforePurchase.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right font-semibold text-red-600">{purchasePrice.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right font-bold text-green-600">{runningPointsLeft.toLocaleString()}</td>
                                                                <td className="px-4 py-3">{player.contactNo || '-'}</td>
                                                            </tr>
                                                        );
                                                    })}

                                                    {/* Empty row if no players yet */}
                                                    {sortedPlayers.length === 0 && (
                                                        <tr>
                                                            <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                                                                No players purchased yet
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {/* Summary Row */}
                                                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                                                        <td colSpan={4} className="px-4 py-3">Total Players: {sortedPlayers.length}</td>
                                                        <td className="px-4 py-3 text-right">Initial: {team.totalPoints?.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right text-red-600">Spent: {(team.pointsSpent || 0).toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right text-green-600">Remaining: {(team.pointsLeft || team.totalPoints || 0).toLocaleString()}</td>
                                                        <td className="px-4 py-3"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}

                                {auction.teams.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No teams added to this auction yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card className="mb-8">
                        <div className="p-8 text-center">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Auction Details Not Available</h3>
                            <p className="text-gray-600">
                                {auction.status === 'upcoming'
                                    ? 'Auction details will be available once the auction starts.'
                                    : 'No auction data available at the moment.'
                                }
                            </p>
                        </div>
                    </Card>
                )}

                {/* Basic Auction Info */}
                <Card className="mb-8">
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Auction Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 font-medium">Status</div>
                                <div className="text-lg font-semibold capitalize">{auction.status}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 font-medium">Total Teams</div>
                                <div className="text-lg font-semibold">{auction.teams.length}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 font-medium">Total Players</div>
                                <div className="text-lg font-semibold">{auction.players.length}</div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
