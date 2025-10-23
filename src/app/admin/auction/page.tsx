'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Select } from '@/components/ui';
import { ITournament } from '@/types/Tournament';
import { IPlayer } from '@/types/Player';
import { ITeam } from '@/types/Team';

const categories = ['Platinum', 'Diamond', 'Gold', 'Silver', 'Bronze'];

export default function AuctionControl() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<ITournament[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<ITournament | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [playerQueue, setPlayerQueue] = useState<IPlayer[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<IPlayer | null>(null);
  const [bidData, setBidData] = useState({
    teamId: '',
    bidAmount: 0,
  });
  const [auctionLog, setAuctionLog] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    
    await fetchData();
    setLoading(false);
  };

  const fetchData = async () => {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      const response = await fetch('/api/admin/config', { headers });
      const data = await response.json();
      
      if (data.success) {
        setTournaments(data.tournaments);
        setTeams(data.teams);
        
        // Set first active tournament
        const activeTournament = data.tournaments.find((t: ITournament) => 
          t.status === 'live' || t.status === 'setup'
        );
        if (activeTournament) {
          setSelectedTournament(activeTournament);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const fetchPlayerQueue = async (category: string) => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await fetch(`/api/auction/queue?category=${category}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPlayerQueue(data.players);
        setCurrentPlayerIndex(0);
        if (data.players.length > 0) {
          setCurrentPlayer(data.players[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch player queue:', error);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    fetchPlayerQueue(category);
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPlayer || !selectedTournament || !bidData.teamId || !bidData.bidAmount) {
      alert('Please fill all fields');
      return;
    }
    
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await fetch('/api/auction/bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerId: currentPlayer._id,
          teamId: bidData.teamId,
          bidAmount: bidData.bidAmount,
          tournamentId: selectedTournament._id,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add to auction log
        setAuctionLog([...auctionLog, data.transaction]);
        
        // Move to next player
        if (currentPlayerIndex < playerQueue.length - 1) {
          const nextIndex = currentPlayerIndex + 1;
          setCurrentPlayerIndex(nextIndex);
          setCurrentPlayer(playerQueue[nextIndex]);
        } else {
          // No more players in this category
          setCurrentPlayer(null);
          alert('All players in this category have been auctioned!');
        }
        
        // Reset bid form
        setBidData({ teamId: '', bidAmount: 0 });
        
        // Refresh teams data
        await fetchData();
      } else {
        alert(data.error || 'Bid failed');
      }
    } catch (error) {
      console.error('Bid error:', error);
      alert('Failed to process bid');
    }
  };

  const getMinBid = () => {
    if (!selectedTournament || !currentPlayer) return 0;
    const category = currentPlayer.category || currentPlayer.selfAssignedCategory;
    return selectedTournament.minBidByCategory[category] || 0;
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Live Auction Control</h1>
          <Button variant="secondary" onClick={() => router.push('/admin')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Auction Control Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tournament & Category Selection */}
            <Card title="Auction Setup">
              <div className="space-y-4">
                <Select
                  label="Select Tournament"
                  value={selectedTournament?._id?.toString() || ''}
                  onChange={(e) => {
                    const tournament = tournaments.find(t => t._id?.toString() === e.target.value);
                    setSelectedTournament(tournament || null);
                  }}
                  options={tournaments.map(t => ({
                    value: t._id?.toString() || '',
                    label: `${t.name} (${t.status})`,
                  }))}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        variant={selectedCategory === cat ? 'primary' : 'secondary'}
                        onClick={() => handleCategorySelect(cat)}
                        className="text-sm"
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Current Player */}
            {currentPlayer && (
              <Card title="Current Player">
                <div className="flex items-start space-x-6">
                  {currentPlayer.photoUrl && (
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">Photo</span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{currentPlayer.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-medium">{currentPlayer.type || 'Not Set'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Category:</span>
                        <span className="ml-2 font-medium">{currentPlayer.category || currentPlayer.selfAssignedCategory}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Skill Level:</span>
                        <span className="ml-2 font-medium">{currentPlayer.skillLevel}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Contact:</span>
                        <span className="ml-2 font-medium">{currentPlayer.contactNo}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 rounded">
                      <span className="text-blue-900 font-semibold">
                        Minimum Bid: {getMinBid()} Points
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Bid Entry */}
            {currentPlayer && (
              <Card title="Enter Bid">
                <form onSubmit={handleBidSubmit} className="space-y-4">
                  <Select
                    label="Winning Team"
                    value={bidData.teamId}
                    onChange={(e) => setBidData({ ...bidData, teamId: e.target.value })}
                    options={teams.map(team => ({
                      value: team._id?.toString() || '',
                      label: `${team.name} (${team.pointsLeft} points left)`,
                    }))}
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Final Bid Amount
                    </label>
                    <input
                      type="number"
                      min={getMinBid()}
                      value={bidData.bidAmount}
                      onChange={(e) => setBidData({ ...bidData, bidAmount: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <Button type="submit" variant="primary" className="w-full">
                    Confirm Sale
                  </Button>
                </form>
              </Card>
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Queue Info */}
            <Card title="Player Queue">
              {selectedCategory && playerQueue.length > 0 ? (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Category: <span className="font-medium">{selectedCategory}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Player {currentPlayerIndex + 1} of {playerQueue.length}
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {playerQueue.map((player, index) => (
                      <div
                        key={player._id?.toString()}
                        className={`p-2 text-sm rounded ${
                          index === currentPlayerIndex
                            ? 'bg-blue-100 font-medium'
                            : index < currentPlayerIndex
                            ? 'bg-gray-100 line-through'
                            : ''
                        }`}
                      >
                        {index + 1}. {player.name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Select a category to view queue</p>
              )}
            </Card>

            {/* Recent Transactions */}
            <Card title="Recent Transactions">
              {auctionLog.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {auctionLog.slice().reverse().map((log, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium">{log.playerName}</p>
                      <p className="text-gray-600">
                        {log.teamName} - {log.bidAmount} points
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No transactions yet</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
