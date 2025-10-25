'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Select } from '@/components/ui';
import { ITournament } from '@/types/Tournament';
import { IPlayer } from '@/types/Player';
import { ITeam } from '@/types/Team';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Login state
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [tournaments, setTournaments] = useState<ITournament[]>([]);
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  // Forms state
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    description: '',
    eventType: 'tournament',
    startDate: '',
    endDate: '',
    venue: '',
    registrationType: 'individual',
    pricePerPerson: 0,
    pricePerTeam: 0,
    amenities: '',
    facilities: '',
    maxParticipants: '',
    minParticipants: 1,
  });
  const [teamForm, setTeamForm] = useState({
    name: '',
    owner: '',
    totalBudget: 8000,
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
      // Fetch tournaments and teams
      const configResponse = await fetch('/api/admin/config', { headers });
      const configData = await configResponse.json();

      if (configData.success) {
        setTournaments(configData.tournaments || []);
        setTeams(configData.teams || []);
      }

      // Fetch players
      const playersResponse = await fetch('/api/register', { headers });
      const playersData = await playersResponse.json();

      if (playersData.success) {
        setPlayers(playersData.players || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'tournament',
          data: {
            name: tournamentForm.name,
            description: tournamentForm.description,
            eventType: tournamentForm.eventType,
            startDate: tournamentForm.startDate,
            endDate: tournamentForm.endDate,
            venue: tournamentForm.venue,
            registrationType: tournamentForm.registrationType,
            pricePerPerson: tournamentForm.pricePerPerson,
            pricePerTeam: tournamentForm.pricePerTeam,
            amenities: tournamentForm.amenities.split(',').map(a => a.trim()).filter(a => a),
            facilities: tournamentForm.facilities.split(',').map(f => f.trim()).filter(f => f),
            maxParticipants: tournamentForm.maxParticipants ? Number(tournamentForm.maxParticipants) : undefined,
            minParticipants: tournamentForm.minParticipants,
            status: 'registration',
            // Legacy auction fields for tournaments
            minBidByCategory: {
              "Platinum": 500,
              "Diamond": 300,
              "Gold": 100
            },
            squadCapByCategory: {
              "Platinum": 2,
              "Diamond": 3,
              "Gold": 5
            }
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowTournamentForm(false);
        setTournamentForm({
          name: '',
          description: '',
          eventType: 'tournament',
          startDate: '',
          endDate: '',
          venue: '',
          registrationType: 'individual',
          pricePerPerson: 0,
          pricePerTeam: 0,
          amenities: '',
          facilities: '',
          maxParticipants: '',
          minParticipants: 1,
        });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create tournament:', error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'team',
          data: teamForm,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowTeamForm(false);
        setTeamForm({ name: '', owner: '', totalBudget: 8000 });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const handleUpdatePlayer = async (playerId: string, updates: Partial<IPlayer>) => {
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(`/api/admin/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to update player:', error);
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
          <div className="mt-4 flex justify-center">
            <a href="/" className="text-blue-600 hover:underline">
              ← Back to Home
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Link href="/admin/events">
              <Button variant="secondary" className="w-full sm:w-auto">Manage Events</Button>
            </Link>
            <Link href="/admin/players">
              <Button variant="secondary" className="w-full sm:w-auto">Manage Players</Button>
            </Link>
            <Link href="/admin/registrations">
              <Button variant="secondary" className="w-full sm:w-auto">Manage Registrations</Button>
            </Link>
            <Link href="/admin/auction">
              <Button variant="primary" className="w-full sm:w-auto">Auction Control</Button>
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

        {/* Tournaments Section */}
        <Card title="Tournaments" className="mb-8">
          <div className="mb-4">
            <Button onClick={() => setShowTournamentForm(!showTournamentForm)}>
              Create Tournament
            </Button>
          </div>

          {showTournamentForm && (
            <form onSubmit={handleCreateTournament} className="mb-6 p-6 bg-gray-50 rounded-lg space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Event Name"
                  value={tournamentForm.name}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })}
                  required
                />
                <Select
                  label="Event Type"
                  value={tournamentForm.eventType}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, eventType: e.target.value })}
                  options={[
                    { value: 'tournament', label: 'Tournament' },
                    { value: 'activity', label: 'Activity' },
                    { value: 'event', label: 'Event' },
                    { value: 'competition', label: 'Competition' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={tournamentForm.description}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the event..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Date"
                  type="date"
                  value={tournamentForm.startDate}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, startDate: e.target.value })}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={tournamentForm.endDate}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, endDate: e.target.value })}
                />
                <Input
                  label="Venue"
                  value={tournamentForm.venue}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, venue: e.target.value })}
                  placeholder="Event location"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Registration Type"
                  value={tournamentForm.registrationType}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, registrationType: e.target.value })}
                  options={[
                    { value: 'individual', label: 'Individual' },
                    { value: 'team', label: 'Team' },
                    { value: 'both', label: 'Both Individual & Team' },
                  ]}
                />
                <Input
                  label="Max Participants"
                  type="number"
                  value={tournamentForm.maxParticipants}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, maxParticipants: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Price per Person (PKR)"
                  type="number"
                  value={tournamentForm.pricePerPerson}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, pricePerPerson: Number(e.target.value) })}
                  min="0"
                />
                <Input
                  label="Price per Team (PKR)"
                  type="number"
                  value={tournamentForm.pricePerTeam}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, pricePerTeam: Number(e.target.value) })}
                  min="0"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amenities (comma-separated)
                  </label>
                  <textarea
                    value={tournamentForm.amenities}
                    onChange={(e) => setTournamentForm({ ...tournamentForm, amenities: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Food, Transport, Equipment..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facilities (comma-separated)
                  </label>
                  <textarea
                    value={tournamentForm.facilities}
                    onChange={(e) => setTournamentForm({ ...tournamentForm, facilities: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Ground, Changing Rooms, First Aid..."
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" variant="primary">Create Event</Button>
                <Button type="button" variant="secondary" onClick={() => setShowTournamentForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {tournaments && tournaments.length > 0 ? (
              tournaments.map((tournament) => (
                <div key={tournament._id?.toString()} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <h4 className="font-semibold">{tournament.name}</h4>
                    <p className="text-sm text-gray-600">Status: {tournament.status}</p>
                  </div>
                  <Select
                    value={tournament._id?.toString()}
                    onChange={(e) => setSelectedTournament(e.target.value)}
                    options={[
                      { value: '', label: 'Select Tournament' },
                      ...(tournaments || []).map(t => ({ value: t._id?.toString() || '', label: t.name }))
                    ]}
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No tournaments created yet.</p>
            )}
          </div>
        </Card>

        {/* Teams Section */}
        <Card title="Teams" className="mb-8">
          <div className="mb-4">
            <Button onClick={() => setShowTeamForm(!showTeamForm)}>
              Create Team
            </Button>
          </div>

          {showTeamForm && (
            <form onSubmit={handleCreateTeam} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <Input
                label="Team Name"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                required
              />
              <Input
                label="Owner"
                value={teamForm.owner}
                onChange={(e) => setTeamForm({ ...teamForm, owner: e.target.value })}
                required
              />
              <Input
                label="Total Budget"
                type="number"
                value={teamForm.totalBudget}
                onChange={(e) => setTeamForm({ ...teamForm, totalBudget: parseInt(e.target.value) })}
                required
              />
              <div className="flex space-x-2">
                <Button type="submit" variant="primary">Create</Button>
                <Button type="button" variant="secondary" onClick={() => setShowTeamForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {teams && teams.length > 0 ? (
              teams.map((team) => (
                <div key={team._id?.toString()} className="p-3 bg-gray-50 rounded">
                  <h4 className="font-semibold">{team.name}</h4>
                  <p className="text-sm text-gray-600">
                    Owner: {team.owner} | Budget: {team.totalBudget} | Spent: {team.pointsSpent}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No teams created yet.</p>
            )}
          </div>
        </Card>

        {/* Players Section */}
        {/* <Card title="Registered Players">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
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
                {players && players.length > 0 ? (
                  players.map((player) => (
                  <tr key={player._id?.toString()}>
                    <td className="px-6 py-4 whitespace-nowrap">{player.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={player.type || ''}
                        onChange={(e) => handleUpdatePlayer(player._id!.toString(), { type: e.target.value })}
                        options={[
                          { value: '', label: 'Select Type' },
                          { value: 'Batsman', label: 'Batsman' },
                          { value: 'Bowler', label: 'Bowler' },
                          { value: 'Batting All-Rounder', label: 'Batting All-Rounder' },
                          { value: 'Bowling All-Rounder', label: 'Bowling All-Rounder' },
                        ]}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={player.category || player.selfAssignedCategory}
                        onChange={(e) => handleUpdatePlayer(player._id!.toString(), { category: e.target.value })}
                        options={[
                          { value: 'Platinum', label: 'Platinum' },
                          { value: 'Diamond', label: 'Diamond' },
                          { value: 'Gold', label: 'Gold' },
                          { value: 'Silver', label: 'Silver' },
                          { value: 'Bronze', label: 'Bronze' },
                        ]}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${player.status === 'sold' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                        {player.status || 'available'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={player.role || 'Player'}
                        onChange={(e) => handleUpdatePlayer(player._id!.toString(), { role: e.target.value as 'Player' | 'Captain' })}
                        options={[
                          { value: 'Player', label: 'Player' },
                          { value: 'Captain', label: 'Captain' },
                        ]}
                      />
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No players registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card> */}
      </div>
    </div>
  );
}
