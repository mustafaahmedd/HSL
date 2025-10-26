import { Types } from 'mongoose';

export interface IRegistration {
  _id?: Types.ObjectId;
  eventId: Types.ObjectId;
  eventName: string;
  
  // Personal Information
  playerId?: Types.ObjectId;
  name: string;
  contactNo: string;
  isHikmahStudent: boolean;
  courseEnrolled?: string;
  darseNizamiYear?: string;
  currentCourseYear?: string;
  timings: string;
  photoUrl: string;

  
  // Sport-specific details
  playedPreviousLeague?: boolean;
  specialRequirements?: string;
  teamName?: string;
  playBothTournaments?: boolean;
  skillLevel?: string;
  iconPlayerRequest?: boolean;
  selfAssignedCategory?: string;
  playerRole?: string;
  playingStyle?: string;
  position?: string;
  experience?: string;
  level?: string;
  
  // Registration details
  paymentMethod?: string;
  paymentStatus?: string;
  amountPaid?: number;
  isPaid?: boolean;
  assurance?: boolean;
  
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';

  
  // Admin Management
  adminNotes?: string;
  finalizedDetails?: {
    finalName?: string;
    finalEmail?: string;
    finalPhone?: string;
    finalTeamName?: string;
  };
  
  // Admin Management
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}
