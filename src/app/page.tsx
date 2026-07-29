'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { CountdownTimer } from '@/app/api/auth/login/CountdownTimer';
import { ITournament } from '@/types/Tournament';

// HSL Statistics
const hslStats = {
  totalEvents: 12,
  totalParticipants: 450,
  activeMembers: 200
};

const getEventPlaceholderImage = (event: any) => {
  const sport = (event.sport || event.eventType || '').toLowerCase();
  if (sport.includes('farmhouse') || sport.includes('beach') || sport.includes('party')) {
    return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800';
  }
  if (sport.includes('futsal') || sport.includes('football')) {
    return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800';
  }
  if (sport.includes('cycling')) {
    return 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&q=80&w=800';
  }
  if (sport.includes('padel') || sport.includes('tennis')) {
    return 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=800';
  }
  return 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800';
};

export default function HSLHome() {
  const [events, setEvents] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<ITournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [auctionId, setAuctionId] = useState<string>('');
  const [auctionData, setAuctionData] = useState<any>(null);

  useEffect(() => {
    fetchEvents();
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (!events || events.length === 0) return;
    const auctionEvent = events.find((e: any) => e.eventType === 'auction') || events[0];
    if (auctionEvent?._id) {
      fetchAuction(auctionEvent._id);
    }
  }, [events]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events?published=true');
      const data = await response.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchAuction = async (eventId: string) => {
    try {
      const response = await fetch(`/api/auction?eventId=${eventId}`);
      const data = await response.json();
      if (data.success && data.auctions && data.auctions.length > 0) {
        const auction = data.auctions[0];
        const id = auction._id || auction.id || '';
        setAuctionId(id);
        setAuctionData(auction);
      } else {
        setAuctionId('');
        setAuctionData(null);
      }
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
      setAuctionId('');
      setAuctionData(null);
    }
  };

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/admin/config');
      const data = await response.json();
      if (data.success) {
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`status-badge status-${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getEventTypeBadge = (type: string) => {
    return (
      <span className={`event-type-badge event-type-${type || 'tournament'}`}>
        {type ? type.toUpperCase() : 'EVENT'}
      </span>
    );
  };

  // Dynamic Announcement Data from DB
  const upcomingAuctionEvent = events.find((e: any) => e.eventType === 'auction');
  const upcomingTournamentEvent = events.find((e: any) => e.eventType === 'tournament' || e.eventType === 'competition') || events[0];

  const auctionTargetDate = auctionData?.auctionDate || upcomingAuctionEvent?.startDate;
  const isAuctionPast = auctionTargetDate ? new Date(auctionTargetDate) < new Date() : false;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#090d16]/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-emerald-900/30">
              H
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Hikmah Student Life <span className="text-emerald-400 font-normal text-xs ml-1 hidden sm:inline">(HSL)</span>
            </span>
          </div>

          <nav className="flex items-center space-x-6">
            <a href="#events" className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors">
              Events
            </a>
            <a href="#about" className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors">
              About
            </a>
            <Link href="/admin">
              <Button size="sm" className="btn-glass text-xs px-4 py-2 border-slate-700 hover:border-emerald-500/50">
                Admin Login
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section - Main Focus on Hikmah Student Life */}
      <section className="hero-glow-bg py-24 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-800/50 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-8 animate-fade-in">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>HSL • OFFICIAL SPORTS & COMMUNITY PLATFORM</span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-6">
            <span className="text-gradient-emerald">Hikmah Student Life</span>
          </h1>

          <p className="text-xl sm:text-2xl font-medium text-slate-200 max-w-3xl mx-auto leading-relaxed mb-10">
            Empowering students through competitive sports, seasonal leagues, live player auctions, and lifelong community bonding.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="#events">
              <Button className="btn-emerald px-8 py-4 text-base rounded-xl font-bold">
                Explore HSL Events
              </Button>
            </a>
            <a href="#about">
              <Button className="btn-glass px-8 py-4 text-base rounded-xl font-bold">
                About Hikmah Student Life
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Announcements / Live Highlights Section (DB Driven) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0d1322] border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Schedule & Highlights</span>
              <h2 className="text-3xl font-bold text-white mt-1">HSL Announcements</h2>
            </div>
            <p className="text-slate-400 text-sm mt-2 md:mt-0 max-w-md">
              Real-time schedule and auction updates from Hikmah Student Life.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {auctionTargetDate ? (
                  <CountdownTimer
                    targetDate={new Date(auctionTargetDate).toISOString()}
                    title={auctionData?.name || upcomingAuctionEvent?.title || "Cricket Player Auction"}
                    subtitle={
                      auctionData?.status === 'completed' || isAuctionPast
                        ? "Auction Concluded • Rosters Finalized"
                        : `${new Date(auctionTargetDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} • ${upcomingAuctionEvent?.venue || 'Hikmah Institute Auditorium'}`
                    }
                  />
                ) : (
                  <div className="text-center p-6 bg-slate-900/40 rounded-xl border border-slate-800">
                    <h3 className="text-xl font-bold text-white mb-2">Live Cricket Auction</h3>
                    <p className="text-slate-400 text-sm">Stay tuned for the upcoming season auction schedule!</p>
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  if (!auctionId) return;
                  const publicUrl = `${window.location.origin}/auction/${auctionId}/details`;
                  window.open(publicUrl, '_blank');
                }}
                disabled={!auctionId}
                className="mt-6 w-full btn-glass border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
              >
                <span>View Public Auction Portal</span>
              </Button>
            </div>

            <div className="glass-card p-6 sm:p-8 flex flex-col justify-between">
              {upcomingTournamentEvent ? (
                <CountdownTimer
                  targetDate={new Date(upcomingTournamentEvent.startDate).toISOString()}
                  title={upcomingTournamentEvent.title}
                  subtitle={`${new Date(upcomingTournamentEvent.startDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} • ${upcomingTournamentEvent.venue}`}
                />
              ) : (
                <div className="text-center p-6 bg-slate-900/40 rounded-xl border border-slate-800">
                  <h3 className="text-xl font-bold text-white mb-2">HSL Tournament Day</h3>
                  <p className="text-slate-400 text-sm">Check back soon for new tournament announcements!</p>
                </div>
              )}
              <div className="mt-6 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
                Official registration portal for HSL team captains and athletes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#090d16] border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-8 text-center">
              <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 mb-2">{hslStats.totalEvents}+</div>
              <div className="text-slate-300 font-medium">Events & Tournaments</div>
              <p className="text-xs text-slate-500 mt-1">Organized across multiple sports disciplines</p>
            </div>

            <div className="glass-card p-8 text-center">
              <div className="text-4xl sm:text-5xl font-extrabold text-amber-400 mb-2">{hslStats.totalParticipants}+</div>
              <div className="text-slate-300 font-medium">Registered Participants</div>
              <p className="text-xs text-slate-500 mt-1">Active student athletes and players</p>
            </div>

            <div className="glass-card p-8 text-center">
              <div className="text-4xl sm:text-5xl font-extrabold text-sky-400 mb-2">{hslStats.activeMembers}+</div>
              <div className="text-slate-300 font-medium">Active Community Members</div>
              <p className="text-xs text-slate-500 mt-1">Engaged in seasonal sports activities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0d1322] border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Active & Upcoming</span>
            <h2 className="text-4xl font-bold text-white mt-1">Explore Leagues & Events</h2>
            <p className="text-slate-400 mt-3">Select an event below to view schedule details or complete your player registration.</p>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <div key={event._id} className="glass-card overflow-hidden flex flex-col justify-between group">
                  <div>
                    <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                      <img
                        src={event.images?.[0]?.url || getEventPlaceholderImage(event)}
                        alt={event.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getEventPlaceholderImage(event);
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        {getEventTypeBadge(event.eventType)}
                      </div>
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(event.status)}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-bold text-white text-lg mb-2 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Start Date:</span>
                          <span className="font-semibold text-slate-200">{new Date(event.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Venue:</span>
                          <span className="font-semibold text-slate-200">{event.venue}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Registration Fee:</span>
                          <span className="font-semibold text-emerald-400">
                            {event.pricePerPerson > 0 ? `PKR ${event.pricePerPerson}` : 'Free'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 space-y-2">
                    <Link href={`/events/${event._id}`}>
                      <Button className="w-full btn-glass py-2.5 text-xs">
                        View Event Details
                      </Button>
                    </Link>
                    {event.status === 'upcoming' && (
                      <Link href={`/events/${event._id}/register`}>
                        <Button className="w-full btn-emerald py-2.5 text-xs mt-2">
                          Register Now
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center max-w-lg mx-auto">
              <svg className="mx-auto h-12 w-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-bold text-white">No active events listed</h3>
              <p className="text-slate-400 text-sm mt-1">Check back soon for new tournament announcements.</p>
            </div>
          )}
        </div>
      </section>

      {/* The HSL Pillars */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#090d16] border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Principles</span>
          <h2 className="text-3xl font-bold text-white mt-1 mb-12">The HSL Auction & League Experience</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold mb-6">
                🎯
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Strategic Drafts</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Captains manage virtual points budget to strategically formulate competitive squads across Platinum, Diamond, Gold & Silver categories.
              </p>
            </div>

            <div className="glass-card p-8 text-left">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xl font-bold mb-6">
                ⚡
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Live Bidding Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Real-time admin control and broadcast portal that displays live auction updates, team balances, and player rosters.
              </p>
            </div>

            <div className="glass-card p-8 text-left">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-xl font-bold mb-6">
                🏆
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Balanced Competition</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Categorized player ratings ensure every team maintains a balanced squad structure and equal competitive grounding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Access Bar */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-[#0d1322] border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto glass-card p-8 text-center border-slate-700/60">
          <h2 className="text-2xl font-bold text-white mb-2">Administration Portal</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-xl mx-auto">
            Authorized admin access for managing tournaments, registrations, team budgets, and live auction operations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/admin">
              <Button className="btn-emerald px-6 py-2.5 text-xs">
                Admin Dashboard
              </Button>
            </Link>
            <Link href="/admin/auction">
              <Button className="btn-glass px-6 py-2.5 text-xs">
                Auction Control Room
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#090d16]">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">About Us</span>
          <h2 className="text-3xl font-bold text-white mt-1 mb-6">About Hikmah Student Life</h2>
          <p className="text-slate-300 max-w-3xl mx-auto text-base leading-relaxed mb-14">
            Hikmah Student Life is dedicated to developing student leadership, athletic talent, and community bonding through organized sports leagues, structured player auctions, and inclusive activities.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="glass-card p-6">
              <div className="text-3xl mb-3">🥇</div>
              <h3 className="font-bold text-white text-lg mb-2">Sportsmanship</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Fostering high standards of fairness, camaraderie, and mutual respect.</p>
            </div>
            <div className="glass-card p-6">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="font-bold text-white text-lg mb-2">Community</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Bringing students together across diverse academic programs.</p>
            </div>
            <div className="glass-card p-6">
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="font-bold text-white text-lg mb-2">Development</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Providing a platform for individual athletic and personal growth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#060911] border-t border-slate-800/80 py-8 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">H</div>
            <span className="text-slate-400 font-semibold">Hikmah Student Life (HSL)</span>
          </div>
          <p>© {new Date().getFullYear()} Hikmah Student Life. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}