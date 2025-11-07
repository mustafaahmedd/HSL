'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Select, NumberInput } from '@/components/ui';
import { IAuction, IBid, IAuctionSession } from '@/types/Auction';
import { IPlayer } from '@/types/Player';
import { ITeam } from '@/types/Team';
import { IRegistration } from '@/types/Registration';

// Category configuration with pricing
const CATEGORY_CONFIG = [
    {
        name: 'Platinum',
        minBidPrice: 4000,
        bidIncrement: 400,
        color: 'purple',
    },
    {
        name: 'Diamond',
        minBidPrice: 2500,
        bidIncrement: 200,
        color: 'blue',
    },
    {
        name: 'Gold',
        minBidPrice: 1000,
        bidIncrement: 100,
        color: 'yellow',
    },
];

// Helper function to get category configuration
const getCategoryConfig = (categoryName: string) => {
    return CATEGORY_CONFIG.find(cat => cat.name === categoryName) || CATEGORY_CONFIG[CATEGORY_CONFIG.length - 1];
};

export default function AuctionManagement() {
    const router = useRouter();
    const params = useParams();
    const auctionId = params.id as string;

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Auction data
    const [auction, setAuction] = useState<IAuction | null>(null);
    const [session, setSession] = useState<IAuctionSession | null>(null);
    const [bids, setBids] = useState<IBid[]>([]);
    const [stats, setStats] = useState<any>(null);

    // Available data for selection
    const [availablePlayers, setAvailablePlayers] = useState<IPlayer[]>([]);
    const [eventRegistrations, setEventRegistrations] = useState<IRegistration[]>([]);
    const [availableTeams, setAvailableTeams] = useState<ITeam[]>([]);

    // Forms state
    const [showPlayerSelection, setShowPlayerSelection] = useState(false);
    const [showTeamSelection, setShowTeamSelection] = useState(false);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<string[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

    // Live auction state
    const [currentPlayer, setCurrentPlayer] = useState<IRegistration | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentBid, setCurrentBid] = useState<IBid | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [categoryLocked, setCategoryLocked] = useState(false);
    const [queuedPlayers, setQueuedPlayers] = useState<IPlayer[]>([]);
    const [availableCategoryPlayers, setAvailableCategoryPlayers] = useState<IRegistration[]>([]);

    // Moderator edit state
    const [showModeratorEdit, setShowModeratorEdit] = useState(false);
    const [moderatorTeamId, setModeratorTeamId] = useState('');
    const [moderatorBidPrice, setModeratorBidPrice] = useState(0);

    // Captain matching state
    const [captainMatchingStatus, setCaptainMatchingStatus] = useState<{
        unassignedTeams: any[];
        availableCaptains: IRegistration[];
        isMatching: boolean;
        matchLog: string[];
    }>({
        unassignedTeams: [],
        availableCaptains: [],
        isMatching: false,
        matchLog: []
    });

    // Store all captains from registrations (not just those in auction.players)
    const [allApprovedCaptains, setAllApprovedCaptains] = useState<IRegistration[]>([]);
    const [shuffledCaptainQueue, setShuffledCaptainQueue] = useState<IRegistration[]>([]);
    const [shuffledTeamQueue, setShuffledTeamQueue] = useState<any[]>([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastMatchedPair, setLastMatchedPair] = useState<{ captain: string, team: string, photoUrl: string, owner: string } | null>(null);
    const [isShuffling, setIsShuffling] = useState(false);
    const [isCaptainSectionExpanded, setIsCaptainSectionExpanded] = useState(true);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Image Modal Component
    const ImageModal: React.FC<{ src: string; isOpen: boolean; onClose: () => void }> = ({ src, isOpen, onClose }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="relative max-w-4xl max-h-full">
                    <button
                        onClick={onClose}
                        className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={src}
                        alt="Profile"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
        );
    };

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated && auctionId) {
            fetchAuctionData();
        }
    }, [isAuthenticated, auctionId]);

    // Load registrations/teams once auction is known so eventId is available
    useEffect(() => {
        if (isAuthenticated && auction?.eventId) {
            fetchAvailableData();
        }
    }, [isAuthenticated, auction?.eventId]);

    // Check captain assignments when captains or auction data changes
    useEffect(() => {
        if (auction && allApprovedCaptains.length > 0) {
            checkCaptainAssignments();
        }
    }, [auction, allApprovedCaptains]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (session?.isActive && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [session?.isActive, timeRemaining]);

    // Clear currentPlayer if category is not locked or empty
    // Also restore currentPlayer from session if category becomes locked
    useEffect(() => {
        if (!categoryLocked || !selectedCategory) {
            setCurrentPlayer(null);
        }
    }, [categoryLocked, selectedCategory, session?.currentPlayerId]);

    const checkAuth = () => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            setIsAuthenticated(true);
        }
        setLoading(false);
    };

    const fetchAuctionData = async () => {
        const token = localStorage.getItem('adminToken');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const response = await fetch(`/api/auction/${auctionId}`, { headers });
            const data = await response.json();

            if (data.success) {
                setAuction(data.auction);
                setSession(data.session);
                setBids(data.bids);
                setStats(data.stats);

                if (data.session?.currentPlayerId) {
                    setCurrentPlayer(data.session.currentPlayerId);
                }
                if (data.session?.currentHighestBid) {
                    setCurrentBid(data.session.currentHighestBid);
                }
                if (data.session?.biddingEndTime) {
                    const now = new Date();
                    const endTime = new Date(data.session.biddingEndTime);
                    setTimeRemaining(Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000)));
                }
            }
        } catch (error) {
            console.error('Failed to fetch auction data:', error);
        }
    };

    const fetchAvailableData = async () => {
        const token = localStorage.getItem('adminToken');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // Fetch event registrations to display in selection UI
            if (auction?.eventId) {
                const regsResponse = await fetch(`/api/registrations?eventId=${(auction.eventId as any)?._id || auction.eventId}`, { headers });
                // console.log("Regs Response: ", regsResponse);
                const regsData = await regsResponse.json();
                if (regsData.success) {
                    // Separate approved captains from regular registrations
                    const approvedCaptains = regsData.registrations.filter(
                        (reg: IRegistration) => reg.approvedIconPlayer === true && reg.teamId == null
                    );
                    setAllApprovedCaptains(approvedCaptains);

                    // Filter out registrations that are already added to the auction
                    // AND only show approved registrations (status === 'approved') + approvedIconPlayer === true
                    const alreadyAddedIds = auction?.players?.map((p: any) => p._id?.toString()) || [];
                    const availableRegs = regsData.registrations.filter(
                        (reg: IRegistration) =>
                            !alreadyAddedIds.includes(reg._id?.toString()) &&
                            !reg.approvedIconPlayer && reg.status === 'approved'
                        // reg.status === 'approved'
                    );
                    setEventRegistrations(availableRegs);
                }
            }

            // Fetch all teams
            const teamsResponse = await fetch('/api/admin/config', { headers });
            const teamsData = await teamsResponse.json();
            if (teamsData.success) {
                setAvailableTeams(teamsData.teams);
            }
        } catch (error) {
            console.error('Failed to fetch available data:', error);
        }
    };

    const handleAuctionAction = async (action: string, data: any = {}) => {
        const token = localStorage.getItem('adminToken');

        try {
            const response = await fetch(`/api/auction/${auctionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ action, data }),
            });

            const result = await response.json();

            if (result.success) {
                fetchAuctionData();
            } else {
                console.error('Failed to update auction:', result.error);
            }
        } catch (error) {
            console.error('Failed to update auction:', error);
        }
    };

    const handleAddPlayers = async () => {
        if (selectedRegistrationIds.length === 0) {
            alert('Please select at least one registrant.');
            return;
        }

        await handleAuctionAction('add_players', { registrationIds: selectedRegistrationIds });
        setShowPlayerSelection(false);
        setSelectedPlayers([]);
        setSelectedRegistrationIds([]);
        // Refresh available data to update the filtered list
        await fetchAuctionData();
    };

    const fetchCategoryQueue = async (category: string) => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`/api/auction/queue?category=${encodeURIComponent(category)}&auctionId=${auctionId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setQueuedPlayers(data.players);

                // If no players returned, show an alert
                if (data.players.length === 0) {
                    alert(`No available players found in ${category} category. All players may be sold or not approved.`);
                }

                return data.players;
            }
            return [];
        } catch (e) {
            console.error('Failed to fetch queue:', e);
            alert('Failed to fetch player queue. Please try again.');
            return [];
        }
    };

    // Fetch available players for the selected category
    useEffect(() => {
        if (categoryLocked && selectedCategory && auction) {
            const available = auction.players.filter((p: any) =>
                p.approvedCategory === selectedCategory &&
                !p.teamId &&
                !p.approvedIconPlayer
            ) as IRegistration[];

            const sorted = [...available].sort((a, b) => {
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
    }, [categoryLocked, selectedCategory, auction]);

    const scrollToCurrentPlayer = () => {
        setTimeout(() => {
            const element = document.getElementById('current-player-auction');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 150);
    };

    const handleNextRandomizedPlayer = async () => {
        if (!selectedCategory) return;

        // Fetch queue if empty or use existing queue
        let playersToUse = queuedPlayers;
        if (queuedPlayers.length === 0) {
            playersToUse = await fetchCategoryQueue(selectedCategory);
        }

        const next = playersToUse[0];
        console.log("Next Player: ", next);
        if (next) {
            await handleStartBidding(next._id!.toString());
            setQueuedPlayers(prev => prev.slice(1));
            scrollToCurrentPlayer();
        } else {
            // No more players in queue, try fetching fresh queue
            const freshPlayers = await fetchCategoryQueue(selectedCategory);
            if (freshPlayers.length > 0) {
                const firstPlayer = freshPlayers[0];
                await handleStartBidding(firstPlayer._id!.toString());
                setQueuedPlayers(freshPlayers.slice(1));
                scrollToCurrentPlayer();
            } else {
                // No players available in this category
                setCurrentPlayer(null);
                alert(`No more players available in ${selectedCategory} category.`);
            }
        }
    };

    const handleAddTeams = async () => {
        await handleAuctionAction('add_teams', { teamIds: selectedTeams });
        setShowTeamSelection(false);
        setSelectedTeams([]);
    };

    const handleStartBidding = async (registrationId: string) => {
        const token = localStorage.getItem('adminToken');

        try {
            const response = await fetch(`/api/auction/${auctionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'start_bidding',
                    data: { registrationId }
                }),
            });

            const result = await response.json();

            if (result.success) {
                await fetchAuctionData();
            }
        } catch (error) {
            console.error('Failed to start bidding:', error);
        }
    };

    const handleFinalizeBid = async () => {
        if (!currentBid) return;

        const token = localStorage.getItem('adminToken');

        try {
            const response = await fetch(`/api/auction/${auctionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'finalize_bid',
                    data: { bidId: currentBid._id }
                }),
            });

            const result = await response.json();

            if (result.success) {
                fetchAuctionData();
            }
        } catch (error) {
            console.error('Failed to finalize bid:', error);
        }
    };

    const checkAndProgressCategory = async () => {
        if (!selectedCategory || !auction) return;

        // Check if current category is complete
        const remainingPlayers = auction.players.filter((p: any) =>
            p.approvedCategory === selectedCategory &&
            !p.teamId
        ).length;

        if (remainingPlayers === 0) {
            // Category completed! Move to next
            const categoryOrder = ['Platinum', 'Diamond', 'Gold'];
            const currentIndex = categoryOrder.indexOf(selectedCategory);

            if (currentIndex < categoryOrder.length - 1) {
                const nextCategory = categoryOrder[currentIndex + 1];
                const nextCategoryHasPlayers = auction.players.filter((p: any) =>
                    p.approvedCategory === nextCategory &&
                    !p.teamId
                ).length > 0;

                if (nextCategoryHasPlayers) {
                    // Auto-progress to next category
                    setCategoryLocked(false);
                    setQueuedPlayers([]);
                    setSelectedCategory(nextCategory);

                    setTimeout(() => {
                        alert(`${selectedCategory} category completed! Moving to ${nextCategory} category.`);
                        fetchCategoryQueue(nextCategory);
                        setCategoryLocked(true);
                    }, 500);
                } else {
                    alert(`${selectedCategory} category completed! No players in remaining categories. Auction complete!`);
                }
            } else {
                alert('All categories completed! Auction is finished.');
            }
        }
    };

    // Category quota validation function
    const validateTeamCategoryQuota = (team: any, playerCategory: string): { valid: boolean; message?: string } => {
        if (!team || !team.players) {
            return { valid: true };
        }
        const categoryCount = {
            Platinum: 0,
            Diamond: 0,
            Gold: 0
        };

        team.players.forEach((player: any) => {
            const category = player.approvedCategory;
            if (category && categoryCount.hasOwnProperty(category)) {
                categoryCount[category as keyof typeof categoryCount]++;
            }
        });

        // Define quotas
        const quotas = {
            Platinum: 1,
            Diamond: 2,
            Gold: 5
        };

        // Check if adding this player would exceed quota
        const currentCount = categoryCount[playerCategory as keyof typeof categoryCount] || 0;
        const maxAllowed = quotas[playerCategory as keyof typeof quotas] || 999;

        if (currentCount >= maxAllowed) {
            return {
                valid: false,
                message: `Team "${team.title}" already has ${currentCount}/${maxAllowed} ${playerCategory} player(s). Cannot add more ${playerCategory} players.`
            };
        }

        return { valid: true };
    };

    const handleManualAssignment = async () => {
        if (!currentPlayer || !moderatorTeamId || moderatorBidPrice < 0) {
            alert('Please select a team and enter a valid bid price');
            return;
        }

        // Get category-specific minimum bid price
        const categoryConfig = getCategoryConfig(currentPlayer.approvedCategory || 'Gold');
        if (moderatorBidPrice < categoryConfig.minBidPrice) {
            alert(`Minimum bid price for ${categoryConfig.name} category is PKR ${categoryConfig.minBidPrice.toLocaleString()}`);
            return;
        }

        // Find the selected team to get its title
        const selectedTeam = auction?.teams.find((t: any) => t._id.toString() === moderatorTeamId) as any;
        if (!selectedTeam || !selectedTeam.title) {
            alert('Selected team not found');
            return;
        }

        // Validate team category quota
        const playerCategory = currentPlayer.approvedCategory || 'Gold';
        const quotaValidation = validateTeamCategoryQuota(selectedTeam, playerCategory);

        if (!quotaValidation.valid) {
            alert(quotaValidation.message);
            return;
        }

        const token = localStorage.getItem('adminToken');

        try {
            const response = await fetch(`/api/auction/${auctionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'manual_assign',
                    data: {
                        registrationId: currentPlayer._id?.toString(),
                        teamId: moderatorTeamId,
                        teamName: selectedTeam.title,
                        bidPrice: moderatorBidPrice,
                        auctionStatus: 'sold'
                    }
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Clear current player and form state immediately
                setCurrentPlayer(null);
                setShowModeratorEdit(false);
                setModeratorTeamId('');
                setModeratorBidPrice(0);

                await fetchAuctionData();

                // Automatically fetch next random player if category is locked and has players
                if (categoryLocked && selectedCategory) {
                    setTimeout(async () => {
                        await handleNextRandomizedPlayer();
                    }, 900);
                }

                setTimeout(() => checkAndProgressCategory(), 500);
            } else {
                alert(result.error || 'Failed to assign player');
            }
        } catch (error: any) {
            console.error('Failed to manually assign player:', error.message);
            alert('Failed to assign player');
        }
    };

    const handleRemovePlayer = async (registrationId: string, teamId: string, playerName: string) => {
        if (!confirm(`Are you sure you want to remove ${playerName} from this team? This will undo the purchase and return the player to the available pool.`)) {
            return;
        }

        const token = localStorage.getItem('adminToken');

        try {
            const response = await fetch(`/api/auction/${auctionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'remove_player',
                    data: {
                        registrationId: registrationId,
                        teamId: teamId
                    }
                }),
            });

            const result = await response.json();

            if (result.success) {
                alert(`Player ${playerName} removed successfully. Points have been refunded to the team.`);
                await fetchAuctionData();
            } else {
                alert(result.error || 'Failed to remove player');
            }
        } catch (error: any) {
            console.error('Failed to remove player:', error.message);
            alert('Failed to remove player');
        }
    };

    const checkCaptainAssignments = () => {
        if (!auction) return;

        const teamsWithoutCaptains = auction.teams.filter((t: any) => !t.captain);
        const unassignedCaptains = allApprovedCaptains.filter((captain: IRegistration) =>
            !captain.teamName
        );

        setCaptainMatchingStatus({
            unassignedTeams: teamsWithoutCaptains,
            availableCaptains: unassignedCaptains,
            isMatching: false,
            matchLog: []
        });
    };

    // Initialize shuffled queues for matching
    const handleInitializeMatching = async () => {
        if (captainMatchingStatus.availableCaptains.length === 0 || captainMatchingStatus.unassignedTeams.length === 0) {
            alert('No captains or teams available for matching');
            return;
        }

        setIsShuffling(true);

        // Simulate shuffling animation for 1.5 seconds
        await new Promise(resolve => setTimeout(resolve, 4000));

        // Shuffle both lists randomly
        const shuffledCaptains = [...captainMatchingStatus.availableCaptains].sort(() => Math.random() - 0.5);
        const shuffledTeams = [...captainMatchingStatus.unassignedTeams].sort(() => Math.random() - 0.5);

        setShuffledCaptainQueue(shuffledCaptains);
        setShuffledTeamQueue(shuffledTeams);
        setCaptainMatchingStatus(prev => ({ ...prev, matchLog: [] }));
        setIsShuffling(false);
    };

    // Match ONE captain with ONE team
    const handleMatchNextCaptain = async () => {
        if (shuffledCaptainQueue.length === 0 || shuffledTeamQueue.length === 0) {
            alert('No more captains or teams to match! Initialize matching first.');
            return;
        }

        setCaptainMatchingStatus(prev => ({ ...prev, isMatching: true }));
        const token = localStorage.getItem('adminToken');

        try {
            // Get first captain and team from queues
            const captain = shuffledCaptainQueue[0];
            const team = shuffledTeamQueue[0];

            console.log('Matching:', captain.name, 'with', team.title);

            setCaptainMatchingStatus(prev => ({
                ...prev,
                matchLog: [...prev.matchLog, `🔄 Matching ${captain.name} with ${team.title}...`]
            }));

            // Update team with captain
            const updateTeamResponse = await fetch(`/api/teams/${team._id.toString()}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    captain: captain.name,
                    registrationId: captain._id?.toString(),
                    category: captain.approvedCategory || captain.selfAssignedCategory || 'Captain',
                }),
            });

            const teamResult = await updateTeamResponse.json();

            if (teamResult.success) {
                // Update registration with team assignment
                const updateRegResponse = await fetch('/api/registrations', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        registrationId: captain._id?.toString(),
                        teamId: team._id.toString(),
                        teamName: team.title,
                        auctionStatus: 'sold',
                    }),
                });

                const regResult = await updateRegResponse.json();

                if (regResult.success) {
                    // Update log with success
                    setCaptainMatchingStatus(prev => {
                        const newLog = [...prev.matchLog];
                        newLog[newLog.length - 1] = `✓ ${captain.name} → ${team.title}`;
                        return {
                            ...prev,
                            matchLog: newLog,
                            isMatching: false,
                            availableCaptains: prev.availableCaptains.filter(c => c._id?.toString() !== captain._id?.toString()),
                            unassignedTeams: prev.unassignedTeams.filter(t => t._id.toString() !== team._id.toString())
                        };
                    });

                    // Remove from queues
                    setShuffledCaptainQueue(prev => prev.slice(1));
                    setShuffledTeamQueue(prev => prev.slice(1));

                    // Show success modal
                    setLastMatchedPair({ captain: captain.name, team: team.title, photoUrl: captain.photoUrl, owner: team.owner });
                    setShowSuccessModal(true);

                    // Refresh data to get updated DB state
                    await fetchAuctionData();
                    await fetchAvailableData();
                } else {
                    setCaptainMatchingStatus(prev => {
                        const newLog = [...prev.matchLog];
                        newLog[newLog.length - 1] = `✗ Failed to assign ${captain.name} to ${team.title}`;
                        return { ...prev, matchLog: newLog, isMatching: false };
                    });
                }
            } else {
                setCaptainMatchingStatus(prev => {
                    const newLog = [...prev.matchLog];
                    newLog[newLog.length - 1] = `✗ Failed to update team`;
                    return { ...prev, matchLog: newLog, isMatching: false };
                });
            }
        } catch (error) {
            console.error('Failed to match captain:', error);
            setCaptainMatchingStatus(prev => ({
                ...prev,
                matchLog: [...prev.matchLog, '✗ Error occurred during matching'],
                isMatching: false
            }));
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        router.push('/admin/');
        return null;
    }

    if (!auction) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Auction Not Found</h2>
                    <Link href="/admin/auction">
                        <Button variant="primary">Back to Auctions</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
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
                        <Link href="/admin/auction">
                            <Button variant="secondary" className="w-full sm:w-auto">Back to Auctions</Button>
                        </Link>
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto"
                            onClick={() => {
                                localStorage.removeItem('adminToken');
                                setIsAuthenticated(false);
                            }}
                        >
                            Logout
                        </Button>
                    </div>
                </div>

                {/* Captain Assignment Check */}
                {auction.status !== 'completed' && (
                    <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                        <div className="p-4">
                            {/* Accordion Header with Toggle Button */}
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                    Captain Assignment Status
                                </h3>
                                <button
                                    onClick={() => setIsCaptainSectionExpanded(!isCaptainSectionExpanded)}
                                    className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-all duration-200"
                                    aria-label={isCaptainSectionExpanded ? "Collapse section" : "Expand section"}
                                >
                                    <svg
                                        className={`w-5 h-5 text-gray-700 transform transition-transform duration-200 ${isCaptainSectionExpanded ? 'rotate-180' : ''
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Collapsible Content */}
                            {isCaptainSectionExpanded && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                                        <div className="bg-white p-3 rounded-lg shadow-sm">
                                            <div className="text-xs text-gray-600 uppercase font-semibold">Total Captains</div>
                                            <div className="text-2xl font-bold text-purple-600">{allApprovedCaptains.length}</div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg shadow-sm">
                                            <div className="text-xs text-gray-600 uppercase font-semibold">Unassigned Captains</div>
                                            <div className="text-2xl font-bold text-orange-600">
                                                {captainMatchingStatus.availableCaptains.length}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg shadow-sm">
                                            <div className="text-xs text-gray-600 uppercase font-semibold">Assigned Captains</div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {allApprovedCaptains.length - captainMatchingStatus.availableCaptains.length}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg shadow-sm">
                                            <div className="text-xs text-gray-600 uppercase font-semibold">Total Teams</div>
                                            <div className="text-2xl font-bold text-gray-900">{auction.teams.length}</div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg shadow-sm">
                                            <div className="text-xs text-gray-600 uppercase font-semibold">Teams Without Captains</div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {captainMatchingStatus.unassignedTeams.length}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Show unassigned captains and teams side by side */}
                                    {(captainMatchingStatus.availableCaptains.length > 0 || captainMatchingStatus.unassignedTeams.length > 0) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            {/* Unassigned Captains */}
                                            {captainMatchingStatus.availableCaptains.length > 0 && (
                                                <div className="bg-white p-3 rounded-lg shadow-sm border-2 border-purple-200">
                                                    <h4 className="font-semibold text-sm text-purple-700 mb-2 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                                        </svg>
                                                        Unassigned Captains ({captainMatchingStatus.availableCaptains.length})
                                                    </h4>
                                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                                        {captainMatchingStatus.availableCaptains.map((captain) => (
                                                            <div key={captain._id?.toString()} className="flex items-center gap-2 bg-purple-50 p-2 rounded border border-purple-100 hover:border-purple-300 transition-all">
                                                                <img
                                                                    src={captain.photoUrl || '/placeholder-avatar.png'}
                                                                    alt={captain.name}
                                                                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-200"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-medium text-gray-900 truncate">{captain.name}</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {captain.approvedCategory || 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unassigned Teams */}
                                            {captainMatchingStatus.unassignedTeams.length > 0 && (
                                                <div className="bg-white p-3 rounded-lg shadow-sm border-2 border-blue-200">
                                                    <h4 className="font-semibold text-sm text-blue-700 mb-2 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                                                        </svg>
                                                        Teams Without Captains ({captainMatchingStatus.unassignedTeams.length})
                                                    </h4>
                                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                                        {captainMatchingStatus.unassignedTeams.map((team) => (
                                                            <div key={team._id.toString()} className="flex items-center gap-2 bg-blue-50 p-2 rounded border border-blue-100 hover:border-blue-300 transition-all">
                                                                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700">
                                                                    {team.title.charAt(0)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-medium text-gray-900 truncate">{team.title}</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Owner: {team.owner || 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {(captainMatchingStatus.availableCaptains.length > 0 && captainMatchingStatus.unassignedTeams.length > 0) && (
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    variant="secondary"
                                                    onClick={handleInitializeMatching}
                                                    disabled={shuffledCaptainQueue.length > 0 || isShuffling}
                                                    className="flex-1 sm:flex-initial"
                                                >
                                                    {isShuffling ? '⏳ Shuffling...' : '🎲 Shuffle & Initialize'}
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    onClick={handleMatchNextCaptain}
                                                    disabled={captainMatchingStatus.isMatching || shuffledCaptainQueue.length === 0}
                                                    className="flex-1 sm:flex-initial"
                                                >
                                                    {captainMatchingStatus.isMatching ? '⏳ Matching...' : `👉 Match Next Captain (${shuffledCaptainQueue.length} left)`}
                                                </Button>
                                            </div>

                                            {/* {shuffledCaptainQueue.length > 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-sm text-blue-800 font-medium">
                                                🎯 Next Match: <span className="font-bold">{shuffledCaptainQueue[0]?.name}</span> → <span className="font-bold">{shuffledTeamQueue[0]?.title}</span>
                                            </p>
                                        </div>
                                    )} */}

                                            {captainMatchingStatus.matchLog.length > 0 && (
                                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg shadow-md border-2 border-gray-200">
                                                    <h4 className="font-bold text-base text-gray-800 mb-3 flex items-center gap-2">
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        Real-time Matching Log:
                                                    </h4>
                                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                                        {captainMatchingStatus.matchLog.map((log, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`
                                                            p-3 rounded-md flex items-center gap-2 transition-all duration-300
                                                            ${log.startsWith('✓') ? 'bg-green-50 border-l-4 border-green-500 text-green-700' :
                                                                        log.startsWith('✗') ? 'bg-red-50 border-l-4 border-red-500 text-red-700' :
                                                                            'bg-blue-50 border-l-4 border-blue-500 text-blue-700 animate-pulse'}
                                                        `}
                                                            >
                                                                <span className="text-xl">
                                                                    {log.startsWith('✓') ? '✓' : log.startsWith('✗') ? '✗' : '🔄'}
                                                                </span>
                                                                <span className="font-medium flex-1">
                                                                    {log.replace(/^[✓✗🔄]\s*/, '')}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {captainMatchingStatus.availableCaptains.length === 0 && captainMatchingStatus.unassignedTeams.length === 0 && allApprovedCaptains.length > 0 && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-green-800 font-medium">All captains have been assigned to teams!</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                )}

                {/* Category Moderation - Moved Before Live Auction */}
                {auction.status === 'live' && (
                    <Card className="mb-6">
                        <div className="p-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                Category Moderation
                            </h3>

                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200 mb-4">
                                <p className="text-sm text-gray-700 font-medium">Categories proceed in order: Platinum → Diamond → Gold</p>
                                {categoryLocked && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        Category Locked
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Category</label>
                                    <Select
                                        value={selectedCategory}
                                        onChange={(e) => {
                                            if (!categoryLocked) {
                                                setSelectedCategory(e.target.value);
                                            }
                                        }}
                                        disabled={categoryLocked}
                                        options={[
                                            {
                                                value: 'Platinum',
                                                label: `Platinum (${auction.players.filter((r: any) => r.approvedCategory === 'Platinum' && !r.teamId && !r.approvedIconPlayer).length} available)`
                                            },
                                            {
                                                value: 'Diamond',
                                                label: `Diamond (${auction.players.filter((r: any) => (r.approvedCategory) === 'Diamond' && !r.teamId && !r.approvedIconPlayer).length} available)`
                                            },
                                            {
                                                value: 'Gold',
                                                label: `Gold (${auction.players.filter((r: any) => (r.approvedCategory) === 'Gold' && !r.teamId && !r.approvedIconPlayer).length} available)`
                                            },
                                        ]}
                                    />
                                </div>
                                <div className="flex gap-2 items-end">
                                    {!categoryLocked && selectedCategory && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                if (selectedCategory) {
                                                    fetchCategoryQueue(selectedCategory);
                                                    setCategoryLocked(true);
                                                }
                                            }}
                                            className="flex-1"
                                        >
                                            Lock & Load Category
                                        </Button>
                                    )}
                                    {categoryLocked && (
                                        <>
                                            <Button
                                                variant="primary"
                                                onClick={handleNextRandomizedPlayer}
                                                disabled={!selectedCategory || auction.players.filter((p: any) =>
                                                    p.approvedCategory === selectedCategory &&
                                                    !p.teamId
                                                ).length === 0}
                                                className="flex-1"
                                            >
                                                Next Random Player
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    setCategoryLocked(false);
                                                    setQueuedPlayers([]);
                                                }}
                                            >
                                                Unlock
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {selectedCategory && categoryLocked && (
                                <>
                                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-gray-600 font-medium">{selectedCategory} Progress:</span>
                                            <span className="font-bold text-gray-900">
                                                {auction.players.filter((p: any) => p.approvedCategory === selectedCategory && p.teamId).length} sold / {auction.players.filter((p: any) => p.approvedCategory === selectedCategory).length} total
                                            </span>
                                        </div>
                                        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-full transition-all"
                                                style={{
                                                    width: `${(auction.players.filter((p: any) => p.approvedCategory === selectedCategory && p.teamId).length / Math.max(1, auction.players.filter((p: any) => p.approvedCategory === selectedCategory).length)) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Available Players Display */}
                                    {availableCategoryPlayers.length > 0 && (
                                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-sm text-gray-900">
                                                    Available {selectedCategory} Players ({availableCategoryPlayers.length})
                                                </h4>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2">
                                                {availableCategoryPlayers.map((player) => (
                                                    <div
                                                        key={player._id?.toString()}
                                                        className={`flex flex-col items-center p-2 border rounded-lg transition-all ${currentPlayer?._id?.toString() === player._id?.toString()
                                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        {/* Player Image */}
                                                        <div className="relative mb-2">
                                                            <img
                                                                src={player.photoUrl || '/placeholder-avatar.png'}
                                                                alt={player.name}
                                                                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                                                            />
                                                            {/* Category Badge */}
                                                            <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold rounded-full shadow-sm ${player.approvedCategory === 'Platinum' ? 'bg-purple-500 text-white' :
                                                                player.approvedCategory === 'Diamond' ? 'bg-blue-500 text-white' :
                                                                    player.approvedCategory === 'Gold' ? 'bg-yellow-500 text-white' :
                                                                        'bg-gray-500 text-white'
                                                                }`}>
                                                                {player.approvedCategory?.charAt(0) || '?'}
                                                            </span>
                                                        </div>

                                                        {/* Player Name */}
                                                        <div className="text-xs font-medium text-gray-900 text-center truncate w-full px-1 mb-1">
                                                            {player.name}
                                                        </div>

                                                        {/* Player Role */}
                                                        {player.playerRole && (
                                                            <div className="text-xs text-gray-600 text-center truncate w-full px-1 mb-1">
                                                                {player.playerRole}
                                                            </div>
                                                        )}

                                                        {/* Player Playing Style */}
                                                        {player.playingStyle && (
                                                            <div className="text-xs text-gray-600 text-center truncate w-full px-1 mb-1">
                                                                {player.playingStyle}
                                                            </div>
                                                        )}

                                                        {/* Category Tag */}
                                                        <div className="mt-1">
                                                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${player.approvedCategory === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                                                                player.approvedCategory === 'Diamond' ? 'bg-blue-100 text-blue-700' :
                                                                    player.approvedCategory === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {player.approvedCategory || 'Uncategorized'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                )}

                {/* Live Auction - Current Player Display with Bidding Controls */}
                {auction.status === 'live' && currentPlayer && (
                    <Card className="mb-6" id="current-player-auction">
                        <div className="p-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Current Player Auction</h3>

                            {/* Player Display - Vertical Profile View */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-lg border-2 border-blue-200 shadow-md mb-6">
                                {/* Profile Picture and Category Badge */}
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative">
                                        <img
                                            src={currentPlayer.photoUrl || '/placeholder-avatar.png'}
                                            alt={currentPlayer.name}
                                            onClick={() => setSelectedImage(currentPlayer.photoUrl)}
                                            className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl cursor-pointer hover:scale-105 transition-transform duration-200"
                                        />
                                        <span className={`absolute -top-2 -right-2 px-3 py-1 text-xs font-bold rounded-full shadow-lg ${(currentPlayer.approvedCategory) === 'Platinum' ? 'bg-purple-500 text-white' :
                                            (currentPlayer.approvedCategory) === 'Diamond' ? 'bg-blue-500 text-white' :
                                                (currentPlayer.approvedCategory) === 'Gold' ? 'bg-yellow-500 text-white' :
                                                    'bg-gray-500 text-white'
                                            }`}>
                                            {currentPlayer.approvedCategory}
                                        </span>
                                    </div>

                                    {/* Player Name and Basic Info */}
                                    <div className="text-center mt-4">
                                        <h4 className="text-3xl font-bold text-gray-900 mb-2">{currentPlayer.name}</h4>
                                        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {currentPlayer.playerRole || 'Player'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                {currentPlayer.skillLevel || 'N/A'} stars
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing Details Card and Assign Player - Side by Side */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    {/* Auction Details - Left */}
                                    <div className="bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-xl shadow-lg h-full flex flex-col justify-center">
                                        <h5 className="text-lg font-semibold text-gray-900 mb-4 text-center">Auction Details</h5>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                                <div className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Base Price</div>
                                                <div className="text-xl font-bold text-green-700">PKR {getCategoryConfig(currentPlayer.approvedCategory || 'Gold').minBidPrice.toLocaleString()}</div>
                                            </div>
                                            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Bid Increment</div>
                                                <div className="text-xl font-bold text-blue-700">PKR {getCategoryConfig(currentPlayer.approvedCategory || 'Gold').bidIncrement.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bidding Controls - Right */}
                                    <div className="bg-white p-6 border-2 border-gray-200 rounded-xl shadow-lg">
                                        <div className="text-center mb-6">
                                            <h4 className="text-xl font-bold text-gray-900 mb-2">Assign Player to Team</h4>
                                            <p className="text-sm text-gray-600">Select a team and enter the final bid price</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Select Team
                                                </label>
                                                <Select
                                                    value={moderatorTeamId}
                                                    onChange={(e) => setModeratorTeamId(e.target.value)}
                                                    options={[
                                                        ...auction.teams.map((team: any) => ({
                                                            value: team._id.toString(),
                                                            label: `${team.title} (${team.owner}) - PKR ${team.pointsLeft?.toLocaleString()} left`
                                                        }))
                                                    ]}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Final Bid Price (PKR)
                                                </label>
                                                <NumberInput
                                                    value={moderatorBidPrice}
                                                    onChange={(e: any) => setModeratorBidPrice(Number(e.target.value))}
                                                    placeholder={`Min: ${currentPlayer ? getCategoryConfig(currentPlayer.approvedCategory || 'Gold').minBidPrice.toLocaleString() : '500'}`}
                                                    className="text-gray-900"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <Button
                                                variant="primary"
                                                onClick={handleManualAssignment}
                                                disabled={!moderatorTeamId || (currentPlayer ? moderatorBidPrice < getCategoryConfig(currentPlayer.approvedCategory || 'Gold').minBidPrice : true)}
                                                className="flex-1"
                                            >
                                                Assign Player
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    setCurrentPlayer(null);
                                                    setModeratorTeamId('');
                                                    setModeratorBidPrice(0);
                                                    handleNextRandomizedPlayer();
                                                }}
                                            >
                                                Skip Player
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <ImageModal
                    src={selectedImage || ''}
                    isOpen={selectedImage !== null}
                    onClose={() => setSelectedImage(null)}
                />

                {/* Shuffling Animation Modal */}
                {isShuffling && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn">
                        <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform animate-bounceIn">
                            <div className="text-center">
                                {/* Shuffling Icon Animation */}
                                <div className="mb-6 relative">
                                    <div className="flex justify-center items-center gap-4">
                                        {/* Captains Shuffling */}
                                        <div className="flex flex-col items-center">
                                            <div className="relative w-20 h-20 mb-2">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center animate-pulse">
                                                        <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                {/* Shuffling animation dots */}
                                                <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-500 rounded-full animate-ping"></div>
                                                <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
                                            </div>
                                            <span className="text-xs font-semibold text-purple-700">Captains</span>
                                        </div>

                                        {/* Arrow */}
                                        <div className="text-3xl text-gray-400 animate-pulse">⇄</div>

                                        {/* Teams Shuffling */}
                                        <div className="flex flex-col items-center">
                                            <div className="relative w-20 h-20 mb-2">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center animate-pulse" style={{ animationDelay: '0.15s' }}>
                                                        <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                {/* Shuffling animation dots */}
                                                <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                                            </div>
                                            <span className="text-xs font-semibold text-blue-700">Teams</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Shuffling Message */}
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    Shuffling Matches...
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    Randomizing captain and team pairs for fair distribution
                                </p>

                                {/* Animated Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 h-full rounded-full animate-shuffle"></div>
                                </div>

                                <p className="text-xs text-gray-500 mt-4">
                                    Please wait...
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Celebration Modal */}
                {showSuccessModal && lastMatchedPair && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn">
                        <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl transform animate-bounceIn">
                            <div className="text-center">
                                {/* Celebration Icon */}
                                <div className="mb-6 animate-bounce">
                                    <span className="text-8xl">🎉</span>
                                </div>

                                {/* Success Message */}
                                <h2 className="text-3xl font-bold text-green-600 mb-4">
                                    Match Successful!
                                </h2>

                                {/* Matched Pair Details */}
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
                                    <div className="flex items-center justify-center gap-4 text-lg">
                                        <div className="flex-1 text-center">
                                            {lastMatchedPair.photoUrl && (
                                                <img
                                                    src={lastMatchedPair.photoUrl}
                                                    alt={lastMatchedPair.captain}
                                                    className="w-32 h-32 rounded-full object-cover mx-auto mb-2 border-4 border-purple-300"
                                                />
                                            )}
                                            <div className="font-bold text-purple-700 text-xl">{lastMatchedPair.captain}</div>
                                            <div className="text-sm text-gray-600">Captain</div>
                                        </div>

                                        <div className="text-3xl">→</div>

                                        <div className="flex-1 text-left">
                                            <div className="font-bold text-blue-700 text-xl">{lastMatchedPair.owner}</div>
                                            <div className="text-sm text-gray-600">Owner</div>
                                            <div className="font-bold text-blue-700 text-xl">{lastMatchedPair.team}</div>

                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-orange-50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-orange-600">{shuffledCaptainQueue.length}</div>
                                        <div className="text-xs text-gray-600">Captains Remaining</div>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-blue-600">{shuffledTeamQueue.length}</div>
                                        <div className="text-xs text-gray-600">Teams Remaining</div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Button
                                    variant="primary"
                                    onClick={() => setShowSuccessModal(false)}
                                    className="w-full text-lg py-3"
                                >
                                    {shuffledCaptainQueue.length > 0 ? '👉 Continue to Next Match' : '🎊 All Done!'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Moderator Manual Assignment Modal */}
                {showModeratorEdit && currentPlayer && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                            <h3 className="text-xl font-bold mb-4 text-gray-900">Manual Assignment</h3>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Player: <span className="font-bold text-gray-900">{currentPlayer.name}</span>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Team
                                    </label>
                                    <Select
                                        value={moderatorTeamId}
                                        onChange={(e) => setModeratorTeamId(e.target.value)}
                                        options={[
                                            { value: '', label: 'Select a team' },
                                            ...auction.teams.map((team: any) => {
                                                // Calculate category counts for this team
                                                const categoryCount = {
                                                    Platinum: 0,
                                                    Diamond: 0,
                                                    Gold: 0
                                                };

                                                if (team.players) {
                                                    team.players.forEach((player: any) => {
                                                        const category = player.category || player.approvedCategory;
                                                        if (category && categoryCount.hasOwnProperty(category)) {
                                                            categoryCount[category as keyof typeof categoryCount]++;
                                                        }
                                                    });
                                                }

                                                // Check if current player can be added to this team
                                                const playerCategory = currentPlayer?.approvedCategory || 'Gold';
                                                const quotaValidation = validateTeamCategoryQuota(team, playerCategory);
                                                const canAddPlayer = quotaValidation.valid;

                                                return {
                                                    value: team._id.toString(),
                                                    label: `${team.title} (${team.owner}) - 🟣${categoryCount.Platinum}/1 🔵${categoryCount.Diamond}/2 🟡${categoryCount.Gold} ${!canAddPlayer ? '❌ QUOTA FULL' : ''}`,
                                                    disabled: !canAddPlayer
                                                };
                                            })
                                        ]}
                                    />
                                    {moderatorTeamId && (() => {
                                        const selectedTeam = auction.teams.find((t: any) => t._id.toString() === moderatorTeamId);
                                        if (selectedTeam) {
                                            const playerCategory = currentPlayer?.approvedCategory || 'Gold';
                                            const quotaValidation = validateTeamCategoryQuota(selectedTeam, playerCategory);
                                            if (!quotaValidation.valid) {
                                                return (
                                                    <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                                                        ⚠️ {quotaValidation.message}
                                                    </div>
                                                );
                                            }
                                        }
                                        return null;
                                    })()}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Final Bid Price (PKR)
                                    </label>
                                    <NumberInput
                                        value={moderatorBidPrice}
                                        onChange={(e: any) => setModeratorBidPrice(Number(e.target.value))}
                                        placeholder={`Min: ${currentPlayer ? getCategoryConfig(currentPlayer.approvedCategory || 'Gold').minBidPrice.toLocaleString() : '500'}`}
                                        className="text-gray-900"
                                    />
                                    {currentPlayer && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Minimum for {currentPlayer.approvedCategory || 'Gold'}: PKR {getCategoryConfig(currentPlayer.approvedCategory || 'Gold').minBidPrice.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    onClick={handleManualAssignment}
                                    disabled={!moderatorTeamId || (currentPlayer ? moderatorBidPrice < getCategoryConfig(currentPlayer.approvedCategory || 'Gold').minBidPrice : true)}
                                >
                                    Assign Player
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowModeratorEdit(false);
                                        setModeratorTeamId('');
                                        setModeratorBidPrice(0);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
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

                {/* Player Management */}
                <Card title="Player Management" className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <span className="text-sm text-gray-600">
                                {auction.players.length} players selected
                            </span>
                        </div>
                        <Button onClick={() => setShowPlayerSelection(true)}>
                            Add Players
                        </Button>
                    </div>

                    {showPlayerSelection && (
                        <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold text-lg text-gray-900">Select Players to Add</h4>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4"
                                        checked={selectedRegistrationIds.length === eventRegistrations.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedRegistrationIds(eventRegistrations.map(r => r._id!.toString()));
                                            } else {
                                                setSelectedRegistrationIds([]);
                                            }
                                        }}
                                    />
                                    <span className="font-medium text-sm text-blue-600">Select All ({eventRegistrations.length})</span>
                                </label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
                                {eventRegistrations.map((reg) => (
                                    <label key={reg._id?.toString()} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            className="mt-1 w-4 h-4"
                                            checked={selectedRegistrationIds.includes(reg._id!.toString())}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedRegistrationIds([...selectedRegistrationIds, reg._id!.toString()]);
                                                } else {
                                                    setSelectedRegistrationIds(selectedRegistrationIds.filter(id => id !== reg._id!.toString()));
                                                }
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">{reg.name}</div>
                                            <div className="text-xs text-gray-600 mt-1">{reg.playingStyle}</div>
                                            {/* <div className="text-xs text-gray-600 mt-1">{reg.contactNo}</div> */}
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${(reg.approvedCategory) === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                                                    (reg.approvedCategory) === 'Diamond' ? 'bg-blue-100 text-blue-700' :
                                                        (reg.approvedCategory) === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {reg.approvedCategory || 'Uncategorized'}
                                                </span>
                                                {(reg.approvedIconPlayer) ? (
                                                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">
                                                        Captain
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-teal-400 text-gray-100">
                                                        Player
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                <Button onClick={handleAddPlayers} disabled={selectedRegistrationIds.length === 0}>
                                    Add {selectedRegistrationIds.length} Selected
                                </Button>
                                <Button variant="secondary" onClick={() => {
                                    setShowPlayerSelection(false);
                                    setSelectedRegistrationIds([]);
                                }}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Player
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Skill Level
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {auction.players.map((player: any) => (
                                    <tr key={player._id?.toString()} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={player.photoUrl || '/placeholder-avatar.png'}
                                                        alt={player.name}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{player.name}</div>
                                                    {(player.approvedIconPlayer) && (
                                                        <span className="text-xs text-orange-600 font-medium">Captain</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{player.contactNo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.playerRole}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${(player.approvedCategory) === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                                                (player.approvedCategory) === 'Diamond' ? 'bg-blue-100 text-blue-800' :
                                                    (player.approvedCategory) === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {player.approvedCategory}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{player.skillLevel || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${player.teamId ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {player.teamId ? 'sold' : 'available'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {auction.status === 'live' && !player.teamId && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleStartBidding(player._id.toString())}
                                                >
                                                    Start Bidding
                                                </Button>
                                            )}
                                            {player.teamId && player.bidPrice && (
                                                <span className="text-green-600 font-medium">PKR {player.bidPrice.toLocaleString()}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div> */}
                </Card>

                {/* Team Management */}
                <Card title="Team Management">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <span className="text-sm text-gray-600">
                                {auction.teams.length} teams registered
                            </span>
                        </div>
                        <Button onClick={() => setShowTeamSelection(true)}>
                            Add Teams
                        </Button>
                    </div>

                    {showTeamSelection && (
                        <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <h4 className="font-semibold text-lg mb-4 text-gray-900">Select Teams to Add</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
                                {availableTeams.map((team) => (
                                    <label key={team._id?.toString()} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4"
                                            checked={selectedTeams.includes(team._id!.toString())}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTeams([...selectedTeams, team._id!.toString()]);
                                                } else {
                                                    setSelectedTeams(selectedTeams.filter(id => id !== team._id!.toString()));
                                                }
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900">{team.title}</div>
                                            <div className="text-sm text-gray-600 mt-1">Owner: {team.owner}</div>
                                            <div className="text-sm font-medium text-green-600 mt-1">Budget: PKR {team.totalPoints?.toLocaleString()}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                <Button onClick={handleAddTeams} disabled={selectedTeams.length === 0}>
                                    Add Selected Teams
                                </Button>
                                <Button variant="secondary" onClick={() => setShowTeamSelection(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {auction.teams.map((team: any) => (
                            <div key={team._id?.toString()} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                                    <h3 className="text-white font-semibold text-lg text-gray-900">{team.title}</h3>
                                    <p className="text-gray-100 text-sm mt-0.5"><strong>Owner: {team.owner}</strong></p>
                                    <p className="text-gray-100 text-sm mt-0.5"><strong>Captain: {team.captain}</strong></p>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Total Points</span>
                                        <span className="text-sm font-semibold text-gray-900">PKR {team.totalPoints?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Spent</span>
                                        <span className="text-sm font-semibold text-red-600">PKR {team.pointsSpent?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Remaining</span>
                                        <span className="text-sm font-semibold text-green-600">PKR {team.pointsLeft?.toLocaleString() || team.totalPoints?.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Players</span>
                                            <span className="text-xs font-medium text-blue-600">{(team.players || []).length} / {team.maxPlayers}</span>
                                        </div>
                                        <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-full transition-all"
                                                style={{ width: `${Math.min(100, ((team.pointsSpent || 0) / (team.totalPoints || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Temporary section */}
                {/* {auction.status === 'live' || auction.status === 'completed' ? (
                    <div className="flex justify-between items-center my-6">
                        <h3 className="text-2xl font-bold text-gray-900">AUCTION DETAILS</h3>
                        <div className="flex gap-2">
                            <Button
                                variant="primary"
                                onClick={() => {
                                    const publicUrl = `${window.location.origin}/auction/${auctionId}/details`;
                                    navigator.clipboard.writeText(publicUrl);
                                }}
                            >
                                🔗 Copy Public Link
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    const publicUrl = `${window.location.origin}/auction/${auctionId}/details`;
                                    window.open(publicUrl, '_blank');
                                }}
                            >
                                👁️ View Public
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">AUCTION DETAILS</h3>
                    </div>
                )} */}

                {/* Detailed Auction Details - Purchase History */}
                {auction.status == 'live' || auction.status == 'completed' ? (
                    <Card className="my-8">
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">AUCTION DETAILS</h3>
                                <div className="flex gap-2">
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            const publicUrl = `${window.location.origin}/auction/${auctionId}/details`;
                                            navigator.clipboard.writeText(publicUrl);
                                        }}
                                    >
                                        🔗 Copy Public Link
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            const publicUrl = `${window.location.origin}/auction/${auctionId}/details`;
                                            window.open(publicUrl, '_blank');
                                        }}
                                    >
                                        👁️ View Public
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            const printContent = document.getElementById('auction-details-table');
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
                            </div>

                            <div id="auction-details-table" className="overflow-x-auto">
                                {auction.teams.map((team: any, teamIndex: number) => {
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
                                                        <th colSpan={9} className="text-center py-3 text-lg font-bold">
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
                                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Action</th>
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
                                                        <td className="px-4 py-3 text-center">-</td>
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
                                                            <td className="px-4 py-3">
                                                                {(() => {
                                                                    const captainReg = (auction.players as any[]).find((p: any) => p?.name === team.captain);
                                                                    return captainReg?.contactNo || '-';
                                                                })()}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">-</td>
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
                                                                <td className="px-4 py-3 text-center">
                                                                    <button
                                                                        onClick={() => handleRemovePlayer(
                                                                            player.registrationId?.toString() || '',
                                                                            team._id?.toString() || '',
                                                                            player.playerName || 'Player'
                                                                        )}
                                                                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                                                                        title="Remove player from team"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}

                                                    {/* Empty row if no players yet */}
                                                    {sortedPlayers.length === 0 && (
                                                        <tr>
                                                            <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                                                                No players purchased yet
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {/* Summary Row */}
                                                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                                                        <td colSpan={4} className="px-4 py-3">Total Players: {sortedPlayers.length}</td>
                                                        <td className="px-4 py-3 text-right">Initial: {team.totalPoints?.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right text-red-600">Spent: {(team.pointsSpent || 0).toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right text-green-600">Remaining: {(team.pointsLeft || (team.totalPoints - team.pointsSpent)).toLocaleString()}</td>
                                                        <td className="px-4 py-3"></td>
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
                ) : null}
            </div>
        </div>
    );
}
