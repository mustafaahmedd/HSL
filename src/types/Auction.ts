import { Types } from 'mongoose';
import { IPlayer } from './Player';
import { ITeam } from './Team';

export interface IAuction {
  _id?: Types.ObjectId;
  eventId: Types.ObjectId;
  name: string;
  description?: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  auctionDate: Date;
  basePrice: number;
  biddingIncrement: number;
  timeLimitPerPlayer: number; // in seconds
  settings: {
    allowMultipleBids: boolean;
    autoAssignOnTimeout: boolean;
    requireMinimumBids: boolean;
    minimumBidsRequired: number;
  };
  players: Types.ObjectId[] | IPlayer[];
  teams: Types.ObjectId[] | ITeam[];
  totalRevenue: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBid {
  _id?: Types.ObjectId;
  auctionId: Types.ObjectId;
  playerId: Types.ObjectId;
  teamId: Types.ObjectId;
  amount: number;
  timestamp: Date;
  isWinning: boolean;
  bidderInfo: {
    teamName: string;
    ownerName: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAuctionSession {
  auctionId: Types.ObjectId;
  currentPlayerId?: Types.ObjectId;
  currentPlayer?: IPlayer;
  biddingStartTime?: Date;
  biddingEndTime?: Date;
  currentHighestBid?: IBid;
  biddingHistory: IBid[];
  isActive: boolean;
  sessionStats: {
    totalPlayers: number;
    playersSold: number;
    playersRemaining: number;
    totalRevenue: number;
  };
}

export interface IAuctionStats {
  totalAuctions: number;
  activeAuctions: number;
  completedAuctions: number;
  totalRevenue: number;
  averageBidAmount: number;
  playersSold: number;
  teamsParticipating: number;
}

export type AuctionStatus = IAuction['status'];
export type BidStatus = 'pending' | 'winning' | 'outbid' | 'cancelled';
