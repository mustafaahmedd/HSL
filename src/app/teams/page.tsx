'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Card } from '@/components/ui';
import { ITeam, ITeamWithPlayers } from '@/types/Team';
import { IEvent } from '@/types/Event';

export default function TeamsView() {
  // Wrap useSearchParams in Suspense to avoid errors in the client component in Next.js app router.
  // (Place Suspense boundary in your page/layout as well for optimal effect)

  let eventId: string | null = null;

  function SearchParamsReader(props: { onEventId: (id: string | null) => void }) {
    const searchParams = useSearchParams();
    useEffect(() => {
      props.onEventId(searchParams.get('event'));
    }, [searchParams]);
    return null;
  }

  // Inside your component's body:
  const [eventIdState, setEventIdState] = useState<string | null>(null);

  // Use Suspense to wrap the search params hook
  // Render SearchParamsReader in the render return part, not here directly.
  // Wherever you have your JSX return, include:
  // <Suspense fallback={null}><SearchParamsReader onEventId={setEventIdState} /></Suspense>

  // Use eventIdState everywhere in place of eventId


  const [teams, setTeams] = useState<ITeamWithPlayers[]>([]);
  const [event, setEvent] = useState<IEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamsData();
  }, [eventIdState]);

  const fetchTeamsData = async () => {
    try {
      // Fetch teams and event data
      const response = await fetch('/api/events');
      const data = await response.json();

      if (data.success) {
        // Find the event
        if (eventIdState) {
          const found = data.events.find((e: IEvent) => e._id?.toString() === eventIdState);
          setEvent(found || null);
        }

        // Fetch teams for this event
        if (eventIdState) {
          const teamsResponse = await fetch(`/api/teams?eventId=${eventIdState}`);
          const teamsData = await teamsResponse.json();

          if (teamsData.success) {
            setTeams(teamsData.teams);
          }
        } else {
          // For demo purposes, showing all teams
          // In production, you'd filter by event
          setTeams([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      'Platinum': 'bg-purple-100 text-purple-800',
      'Diamond': 'bg-blue-100 text-blue-800',
      'Gold': 'bg-yellow-100 text-yellow-800',
      'Silver': 'bg-gray-100 text-gray-800',
      'Bronze': 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}`}>
        {category}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      'Batsman': 'bg-green-100 text-green-800',
      'Bowler': 'bg-red-100 text-red-800',
      'Batting All Rounder': 'bg-indigo-100 text-indigo-800',
      'Bowling All Rounder': 'bg-pink-100 text-pink-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Team Rosters
          </h1>
          {event && (
            <p className="text-lg text-gray-600">
              {event.title}
            </p>
          )}
        </div>

        {/* Teams Grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {teams.map((team) => (
            <Card key={team._id?.toString()} className="overflow-hidden">
              {/* Team Header */}
              <div className="bg-blue-600 text-white p-6">
                <h2 className="text-2xl font-bold mb-2">{team.title}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="opacity-75">Owner:</span>
                    <span className="ml-2 font-medium">{team.owner || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="opacity-75">Captain:</span>
                    <span className="ml-2 font-medium">{team.captain || 'Not Set'}</span>
                  </div>
                </div>
              </div>

              {/* Budget Info */}
              {team.eventType === 'auction' && (
                <div className="bg-gray-100 px-6 py-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600">Total Budget</p>
                    <p className="text-lg font-bold text-gray-900">{team.totalPoints || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Points Spent</p>
                    <p className="text-lg font-bold text-red-600">{team.pointsSpent || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Points Left</p>
                    <p className="text-lg font-bold text-green-600">{team.pointsLeft || 0}</p>
                  </div>
                </div>
              )}

              {/* Players List */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Squad ({Array.isArray(team.players) ? team.players.length : 0} Players)
                </h3>

                {Array.isArray(team.players) && team.players.length > 0 ? (
                  <div className="space-y-3">
                    {team.players.map((p: any, index: number) => {
                      const playerName = p.playerName || p.registration?.name || 'Unknown Player';
                      const playerRole = p.registration?.playerRole || p.type || 'Not Set';
                      const category = p.category || p.registration?.selfAssignedCategory || 'Not Set';
                      const purchasePrice = p.purchasePrice || 0;

                      return (
                        <div key={p.registrationId?.toString() || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {playerName}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              {getTypeBadge(playerRole)}
                              {getCategoryBadge(category)}
                            </div>
                          </div>
                          {team.eventType === 'auction' && (
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {purchasePrice} pts
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No players in this team yet</p>
                )}
              </div>
            </Card>
          ))}
        </div>

        {teams.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-gray-500">No teams found.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
