import { Types } from 'mongoose';

export interface IRegistration {
  _id?: Types.ObjectId;
  eventId: Types.ObjectId;
  eventName: string;
  eventType: 'tournament' | 'activity' | 'event' | 'competition';
  registrationType: 'individual' | 'team' | 'both';
  
  // Personal Information
  name: string;
  email: string;
  phone: string;
  studentId: string;
  department: string;
  emergencyContact: string;
  
  // Team Information (if applicable)
  teamName?: string;
  teamMembers?: string[];
  
  // Registration Details
  registrationDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  amountPaid: number;
  
  // Additional Information
  specialRequirements?: string;
  notes?: string;
  
  // Admin Management Fields
  adminNotes?: string;
  finalizedDetails?: {
    finalName?: string;
    finalEmail?: string;
    finalPhone?: string;
    finalStudentId?: string;
    finalDepartment?: string;
    finalEmergencyContact?: string;
    finalTeamName?: string;
    finalTeamMembers?: string[];
    finalSpecialRequirements?: string;
  };
  
  // Player Reference (if player exists)
  playerId?: Types.ObjectId;
  
  // Admin Management
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}
