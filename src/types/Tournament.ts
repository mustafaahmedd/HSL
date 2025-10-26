import { Types } from 'mongoose';

export interface ITournament {
  _id?: Types.ObjectId;
  name: string;
  description?: string;
  eventType: 'auction' | 'tournament' | 'activity' | 'competition';
  status: 'registration' | 'setup' | 'live' | 'completed';
  startDate: Date;
  endDate?: Date;
  venue?: string;
  registrationType: 'individual' | 'team' | 'both';
  pricePerPerson: number;
  pricePerTeam: number;
  amenities: string[];
  facilities: string[];
  maxParticipants?: number;
  minParticipants: number;
  images: {
    url: string;
    caption?: string;
    isPrimary: boolean;
  }[];
  totalParticipants: number;
  totalRevenue: number;
  // Legacy fields for auction tournaments
  minBidByCategory: {
    [category: string]: number;
  };
  squadCapByCategory: {
    [category: string]: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export type TournamentStatus = ITournament['status'];

export interface IMinBidConfig {
  category: string;
  minBid: number;
}

export interface ISquadCapConfig {
  category: string;
  maxPlayers: number;
}
