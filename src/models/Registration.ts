import mongoose, { Schema, model, models } from 'mongoose';
import { Types } from 'mongoose';
import { IRegistration } from '@/types/Registration';

const RegistrationSchema = new Schema<IRegistration>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    eventName: {
      type: String,
      required: false,
      trim: true,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: false,
    },
    
    // Personal Information (stored in both Player and Registration for easy access)
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contactNo: {
      type: String,
      required: true,
      trim: true,
    },
    isHikmahStudent: {
      type: Boolean,
      required: true,
    },
    courseEnrolled: {
      type: String,
      trim: true,
    },
    darseNizamiYear: {
      type: String,
      trim: true,
    },
    currentCourseYear: {
      type: String,
      trim: true,
    },
    timings: {
      type: String,
      required: false,
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    
    // Sport-specific details
    playedPreviousLeague: {
      type: Boolean,
      default: false,
    },
    specialRequirements: {
      type: String,
      trim: true,
    },
    teamName: {
      type: String,
      trim: true,
    },
    playBothTournaments: {
      type: Boolean,
      default: false,
    },
    skillLevel: {
      type: String,
      trim: true,
    },
    iconPlayerRequest: {
      type: Boolean,
      default: false,
    },
    selfAssignedCategory: {
      type: String,
      trim: true,
    },
    
    // Admin approved fields
    approvedCategory: {
      type: String,
      default: '',
      trim: true,
    },
    approvedIconPlayer: {
      type: Boolean,
      default: false,
    },
    approvedSkillLevel: {
      type: String,
      trim: true,
    },
    playerRole: {
      type: String,
      trim: true,
    },
    playingStyle: {
      type: String,
      trim: true,
    },
    
    // Other sports
    position: {
      type: String,
      trim: true,
    },
    experience: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      trim: true,
    },
    
    // Registration details
    paymentMethod: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    assurance: {
      type: Boolean,
      default: false,
    },
    
    // Status
    status: {
      type: String,
      // enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    
    // Admin Management
    adminNotes: {
      type: String,
      trim: true,
    },
    finalizedDetails: {
      finalName: { type: String, trim: true },
      finalEmail: { type: String, trim: true },
      finalPhone: { type: String, trim: true },
    },
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
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    
    // Auction-specific fields
    auctionStatus: {
      type: String,
      enum: ['available', 'sold', 'unsold'],
      default: 'available',
    },
    bidPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
RegistrationSchema.index({ eventId: 1, status: 1 });
RegistrationSchema.index({ playerId: 1 });
RegistrationSchema.index({ status: 1 });

const Registration = models.Registration || model<IRegistration>('Registration', RegistrationSchema);

export default Registration;