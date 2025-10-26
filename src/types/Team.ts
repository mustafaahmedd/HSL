import { Types } from 'mongoose';
import { IRegistration } from './Registration';

// Player in team (for regular events)
export interface ITeamPlayer {
  registrationId: Types.ObjectId;
}

// Player in auction team (with auction-specific data)
export interface IAuctionTeamPlayer {
  registrationId: Types.ObjectId;
  playerName: string;
  category: string;
  purchasePrice: number;
  transactionDate: Date;
}

// Base Team Interface
export interface ITeam {
  _id?: Types.ObjectId;
  eventId: Types.ObjectId;
  eventType: 'tournament' | 'competition' | 'auction' | 'activity';
  name: string;
  captain?: string;
  entry?: 'paid' | 'unpaid';
  entryAmount?: number;
  entryPaid?: number;
  isPaid?: boolean;
  
  // Auction Event Fields
  owner?: string;
  totalPoints?: number;
  pointsSpent?: number;
  pointsLeft?: number;
  
  // Players array (type depends on eventType)
  players: ITeamPlayer[] | IAuctionTeamPlayer[];
  status: 'active' | 'eliminated' | 'winner' | 'inactive';
  
  createdAt?: Date;
  updatedAt?: Date;
}

// Team with populated registrations
export interface ITeamWithRegistrations extends Omit<ITeam, 'players'> {
  players: Array<(ITeamPlayer | IAuctionTeamPlayer) & { registration: IRegistration }>;
}

// Alias for backward compatibility
export interface ITeamWithPlayers extends ITeamWithRegistrations {}

// Team Stats
export interface ITeamStats {
  totalPlayers: number;
  playersByCategory?: {
    [category: string]: number;
  };
  playersByType?: {
    [type: string]: number;
  };
  totalSpent?: number;
  averagePurchasePrice?: number;
}
