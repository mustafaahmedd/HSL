'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Select } from '@/components/ui';
import { IAuction } from '@/types/Auction';
import { IEvent } from '@/types/Event';

export default function AuctionDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Login state
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [auctions, setAuctions] = useState<IAuction[]>([]);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [stats, setStats] = useState({
    totalAuctions: 0,
    activeAuctions: 0,
    completedAuctions: 0,
    totalRevenue: 0,
  });

  // Forms state
  const [showAuctionForm, setShowAuctionForm] = useState(false);
  const [auctionForm, setAuctionForm] = useState({
    eventId: '',
    name: '',
    description: '',
    auctionDate: '',
    basePrice: 100,
    biddingIncrement: 50,
    timeLimitPerPlayer: 300,
    settings: {
      allowMultipleBids: true,
      autoAssignOnTimeout: false,
      requireMinimumBids: true,
      minimumBidsRequired: 1,
    },
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      fetchData();
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
        fetchData();
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('Login failed');
    }
  };

  const fetchData = async () => {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      // Fetch auctions
      const auctionsResponse = await fetch('/api/auction', { headers });
      const auctionsData = await auctionsResponse.json();

      if (auctionsData.success) {
        setAuctions(auctionsData.auctions);

        // Calculate stats
        const totalAuctions = auctionsData.auctions.length;
        const activeAuctions = auctionsData.auctions.filter((a: IAuction) => a.status === 'live').length;
        const completedAuctions = auctionsData.auctions.filter((a: IAuction) => a.status === 'completed').length;
        const totalRevenue = auctionsData.auctions.reduce((sum: number, a: IAuction) => sum + a.totalRevenue, 0);

        setStats({
          totalAuctions,
          activeAuctions,
          completedAuctions,
          totalRevenue,
        });
      }

      // Fetch events for dropdown
      const eventsResponse = await fetch('/api/events', { headers });
      const eventsData = await eventsResponse.json();

      if (eventsData.success) {
        setEvents(eventsData.events);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch('/api/auction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(auctionForm),
      });

      const data = await response.json();

      if (data.success) {
        setShowAuctionForm(false);
        setAuctionForm({
          eventId: '',
          name: '',
          description: '',
          auctionDate: '',
          basePrice: 100,
          biddingIncrement: 50,
          timeLimitPerPlayer: 300,
          settings: {
            allowMultipleBids: true,
            autoAssignOnTimeout: false,
            requireMinimumBids: true,
            minimumBidsRequired: 1,
          },
        });
        fetchData();
      } else {
        console.error('Failed to create auction:', data.error);
      }
    } catch (error) {
      console.error('Failed to create auction:', error);
    }
  };

  const handleAuctionAction = async (auctionId: string, action: string) => {
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(`/api/auction/${auctionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action, data: {} }),
      });

      const data = await response.json();

      if (data.success) {
        fetchData();
      } else {
        console.error('Failed to update auction:', data.error);
      }
    } catch (error) {
      console.error('Failed to update auction:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
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
            <Button type="submit" variant="primary" className="w-full">
              Login
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Auction Control Center</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Link href="/admin">
              <Button variant="secondary" className="w-full sm:w-auto">Admin Dashboard</Button>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalAuctions}</div>
            <div className="text-sm text-gray-600">Total Auctions</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.activeAuctions}</div>
            <div className="text-sm text-gray-600">Active Auctions</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-gray-600">{stats.completedAuctions}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-purple-600">PKR {stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </Card>
        </div>

        {/* Create Auction Section */}
        <Card title="Create New Auction" className="mb-8">
          <div className="mb-4">
            <Button onClick={() => setShowAuctionForm(!showAuctionForm)}>
              Create Auction
            </Button>
          </div>

          {showAuctionForm && (
            <form onSubmit={handleCreateAuction} className="mb-6 p-6 bg-gray-50 rounded-lg space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Event"
                  value={auctionForm.eventId}
                  onChange={(e) => setAuctionForm({ ...auctionForm, eventId: e.target.value })}
                  options={[
                    { value: '', label: 'Select Event' },
                    ...events.map(e => ({ value: e._id?.toString() || '', label: e.title }))
                  ]}
                  required
                />
                <Input
                  label="Auction Name"
                  value={auctionForm.name}
                  onChange={(e) => setAuctionForm({ ...auctionForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={auctionForm.description}
                  onChange={(e) => setAuctionForm({ ...auctionForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the auction..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Auction Date & Time"
                  type="datetime-local"
                  value={auctionForm.auctionDate}
                  onChange={(e) => setAuctionForm({ ...auctionForm, auctionDate: e.target.value })}
                  required
                />
                <Input
                  label="Base Price (PKR)"
                  type="number"
                  value={auctionForm.basePrice}
                  onChange={(e) => setAuctionForm({ ...auctionForm, basePrice: parseInt(e.target.value) })}
                  min="1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Bidding Increment (PKR)"
                  type="number"
                  value={auctionForm.biddingIncrement}
                  onChange={(e) => setAuctionForm({ ...auctionForm, biddingIncrement: parseInt(e.target.value) })}
                  min="1"
                />
                <Input
                  label="Time Limit per Player (seconds)"
                  type="number"
                  value={auctionForm.timeLimitPerPlayer}
                  onChange={(e) => setAuctionForm({ ...auctionForm, timeLimitPerPlayer: parseInt(e.target.value) })}
                  min="30"
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit" variant="primary">Create Auction</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAuctionForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Auctions List */}
        <Card title="All Auctions">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Players
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auctions.map((auction) => (
                  <tr key={auction._id?.toString()}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{auction.name}</div>
                        {auction.description && (
                          <div className="text-sm text-gray-500">{auction.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(auction.eventId as any)?.title || 'Unknown Event'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(auction.auctionDate).toLocaleDateString()} {new Date(auction.auctionDate).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(auction.status)}`}>
                        {auction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {auction.players.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      PKR {auction.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link href={`/admin/auction/${auction._id}`}>
                        <Button variant="secondary" size="sm">Manage</Button>
                      </Link>
                      {auction.status === 'upcoming' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAuctionAction(auction._id!.toString(), 'start_auction')}
                        >
                          Start
                        </Button>
                      )}
                      {auction.status === 'live' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAuctionAction(auction._id!.toString(), 'end_auction')}
                        >
                          End
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}