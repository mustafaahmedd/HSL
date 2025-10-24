'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { ITournament } from '@/types/Tournament';

// Mock data for previous events - in production, this would come from API
const previousEvents = [
  {
    id: 1,
    name: "Winter Cricket Championship 2023",
    date: "2023-12-15",
    participants: 48,
    revenue: 24000,
    image: "/api/placeholder/400/300",
    type: "tournament",
    status: "completed"
  },
  {
    id: 2,
    name: "Summer Football League 2023",
    date: "2023-08-20",
    participants: 64,
    revenue: 32000,
    image: "/api/placeholder/400/300",
    type: "tournament",
    status: "completed"
  },
  {
    id: 3,
    name: "Cultural Night 2023",
    date: "2023-11-10",
    participants: 120,
    revenue: 15000,
    image: "/api/placeholder/400/300",
    type: "event",
    status: "completed"
  },
  {
    id: 4,
    name: "Academic Quiz Competition",
    date: "2023-09-25",
    participants: 32,
    revenue: 8000,
    image: "/api/placeholder/400/300",
    type: "competition",
    status: "completed"
  }
];

// HSL Statistics
const hslStats = {
  totalEvents: 24,
  totalParticipants: 1200,
  totalRevenue: 180000,
  activeMembers: 150
};

export default function HSLHome() {
  const [events, setEvents] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<ITournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    fetchTournaments();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events?published=true');
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
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
    const typeColors = {
      tournament: 'bg-blue-100 text-blue-800',
      activity: 'bg-green-100 text-green-800',
      event: 'bg-purple-100 text-purple-800',
      competition: 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[type as keyof typeof typeColors]}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-8">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Hikmah Student Life
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-4xl mx-auto leading-relaxed">
              Empowering students through sports, activities, and community engagement.
              Join our vibrant community and create unforgettable memories.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="#events">
                <Button variant="primary" size="lg" className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  Explore Events
                </Button>
              </Link>
              <Link href="#about">
                <Button variant="secondary" size="lg" className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:bg-white/20 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-20 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Our Impact</h2>
            <p className="text-xl text-gray-200">Building a stronger community through shared experiences</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-purple-300 mb-2 sm:mb-3">{hslStats.totalEvents}</div>
              <div className="text-gray-200 font-medium text-sm sm:text-base">Events Organized</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-300 mb-2 sm:mb-3">{hslStats.totalParticipants}</div>
              <div className="text-gray-200 font-medium text-sm sm:text-base">Total Participants</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pink-300 mb-2 sm:mb-3">{hslStats.activeMembers}</div>
              <div className="text-gray-200 font-medium text-sm sm:text-base">Active Members</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-300 mb-2 sm:mb-3">PKR {hslStats.totalRevenue.toLocaleString()}</div>
              <div className="text-gray-200 font-medium text-sm sm:text-base">Community Revenue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div id="events" className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Our Events</h2>
            <p className="text-xl text-gray-200">Celebrating our successful events and community achievements</p>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-16">
              {events.map((event) => (
                <div key={event._id} className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-hidden hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-2xl">
                  <div className="relative">
                    <img
                      src={event.images?.[0]?.url || '/api/placeholder/400/300'}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      {getEventTypeBadge(event.eventType)}
                    </div>
                    <div className="absolute top-4 right-4">
                      {getStatusBadge(event.status)}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-white mb-3 text-lg line-clamp-2">{event.title}</h3>
                    <p className="text-gray-300 mb-4 line-clamp-2">{event.description}</p>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="text-white font-medium">{new Date(event.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Venue:</span>
                        <span className="text-white font-medium">{event.venue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="text-green-300 font-medium">
                          {event.pricePerPerson > 0 ? `PKR ${event.pricePerPerson}` : 'Free'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Link href={`/events/${event._id}`}>
                        <Button variant="primary" className="w-full mb-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                          View Details
                        </Button>
                      </Link>
                      {event.status === 'upcoming' && (
                        <Link href={`/register?event=${event._id}`}>
                          <Button variant="secondary" className="w-full bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:bg-white/20">
                            Register Now
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-300 text-lg">No events available at the moment.</p>
              <p className="text-gray-400 mt-2">Check back soon for exciting new activities!</p>
            </div>
          )}
        </div>
      </div>

      {/* Auction Section */}

      <div className="py-20 bg-gradient-to-r from-green-900 via-emerald-900 to-teal-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">🏏 Cricket Player Auctions</h2>
            <p className="text-xl text-gray-200 mb-8">Build your dream cricket team through exciting player auctions</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auction">
                <Button variant="primary" size="lg" className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  View Auctions
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" size="lg" className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:bg-white/20">
                  Register as Player
                </Button>
              </Link>
            </div>
          </div> */}

          <h2 className="text-4xl font-bold text-white mb-6">The Hikmah Student Life Way</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-3">Strategic Bidding</h3>
              <p className="text-gray-200 text-sm">Plan your budget and bid strategically to get the best players for your team</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-3">Live Auctions</h3>
              <p className="text-gray-200 text-sm">Participate in real-time auctions with live bidding and instant updates</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-white mb-3">Team Building</h3>
              <p className="text-gray-200 text-sm">Create balanced teams with players from different categories and skill levels</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Section */}
      <div className="py-16 bg-gradient-to-r from-slate-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Admin Access</h2>
          <p className="text-gray-300 mb-8">Manage events, players, tournaments, and auctions</p>
          <div className="flex flex-col gap-4 justify-center">
            <Link href="/admin">
              <Button variant="primary" size="lg" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Admin Dashboard
              </Button>
            </Link>
            <Link href="/admin/auction">
              <Button variant="secondary" size="lg" className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:bg-white/20">
                Auction Control
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="py-20 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-8 text-white">About Hikmah Student Life</h2>
            <p className="text-xl mb-12 max-w-4xl mx-auto text-gray-200 leading-relaxed">
              We believe in fostering a vibrant student community through sports, cultural events,
              and academic competitions. Our platform brings together students from all backgrounds
              to create lasting memories and build lifelong friendships.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 mt-12 sm:mt-16">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">🏆</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Competitive Spirit</h3>
                <p className="text-gray-200 text-sm sm:text-base">Organized tournaments and competitions that bring out the best in every student</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">🤝</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Community Building</h3>
                <p className="text-gray-200 text-sm sm:text-base">Events that bring students together and create lasting bonds</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">🌟</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Personal Growth</h3>
                <p className="text-gray-200 text-sm sm:text-base">Opportunities for skill development and character building</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 Hikmah Student Life. Building communities, creating memories.
          </p>
        </div>
      </div>
    </div>
  );
}