import mongoose, { Schema, model, models } from 'mongoose';
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

const RegistrationSchema = new Schema<IRegistration>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['tournament', 'activity', 'event', 'competition'],
      required: true,
    },
    registrationType: {
      type: String,
      enum: ['individual', 'team', 'both'],
      required: true,
    },
    
    // Personal Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    emergencyContact: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Team Information
    teamName: {
      type: String,
      trim: true,
    },
    teamMembers: [{
      type: String,
      trim: true,
    }],
    
    // Registration Details
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    
    // Additional Information
    specialRequirements: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    
    // Admin Management Fields
    adminNotes: {
      type: String,
      trim: true,
    },
    finalizedDetails: {
      finalName: { type: String, trim: true },
      finalEmail: { type: String, trim: true },
      finalPhone: { type: String, trim: true },
      finalStudentId: { type: String, trim: true },
      finalDepartment: { type: String, trim: true },
      finalEmergencyContact: { type: String, trim: true },
      finalTeamName: { type: String, trim: true },
      finalTeamMembers: [{ type: String, trim: true }],
      finalSpecialRequirements: { type: String, trim: true },
    },
    
    // Player Reference
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
    },
    
    // Admin Management
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
RegistrationSchema.index({ eventId: 1, status: 1 });
RegistrationSchema.index({ email: 1 });
RegistrationSchema.index({ studentId: 1 });
RegistrationSchema.index({ registrationDate: -1 });
RegistrationSchema.index({ status: 1 });

const Registration = models.Registration || model<IRegistration>('Registration', RegistrationSchema);

export default Registration;
