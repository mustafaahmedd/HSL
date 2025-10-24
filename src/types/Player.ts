import { Types } from 'mongoose';

export interface IPlayer {
  _id?: Types.ObjectId;
  // Registration Form Fields
  name: string;
  contactNo: string;
  isHikmahStudent: boolean;
  courseEnrolled?: string;
  darseNizamiYear?: string;
  currentCourseYear?: string;
  timings: string;
  playBothTournaments: boolean;
  skillLevel: string;
  iconPlayerRequest: boolean;
  selfAssignedCategory: string;
  photoUrl: string;
  
  // Admin Override Fields
  type?: string; // Batsman, Bowler, Batting All-Rounder, Bowling All-Rounder
  category?: string; // Platinum, Diamond, Gold, etc.
  
  // Auction Related Fields
  status?: string; // available, sold
  teamId?: Types.ObjectId;
  role?: 'Player' | 'Captain';
  bidPrice?: number;
  
  // Meta
  createdAt?: Date;
  updatedAt?: Date;
}

export type PlayerType = 'Batsman' | 'Bowler' | 'Batting All Rounder' | 'Bowling All Rounder';
export type PlayerCategory = 'Platinum' | 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
export type PlayerRole = IPlayer['role'];
export type PlayerStatus = 'available' | 'sold';
