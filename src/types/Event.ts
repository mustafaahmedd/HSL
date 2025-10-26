import { Types } from 'mongoose';

export interface IEvent {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  eventType: 'auction' | 'tournament' | 'activity' | 'competition';
  sport: 'cricket' | 'football' | 'futsal' | 'cycling' | 'padel' | 'badminton' | 'tennis' | 'basketball' | 'volleyball' | 'swimming' | 'athletics' | 'academic';
  formTemplate: 'cricket' | 'futsal' | 'padel' | 'cycling' | 'generic';
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  startDate: Date;
  startTime: string;
  endTime: string;
  venue: string;
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
  registrationDeadline?: Date;
  isPublished: boolean;
  tags: string[];
  organizer: string;
  contactInfo: {
    phone?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export type EventType = IEvent['eventType'];
export type EventStatus = IEvent['status'];
export type RegistrationType = IEvent['registrationType'];
