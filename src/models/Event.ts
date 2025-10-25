import mongoose, { Schema, model, models } from 'mongoose';
import { IEvent } from '@/types/Event';

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['tournament', 'activity', 'event', 'competition'],
      required: true,
    },
    sport: {
      type: String,
      enum: ['cricket', 'football', 'futsal', 'cycling', 'padel', 'badminton', 'tennis', 'basketball', 'volleyball', 'swimming', 'athletics', 'academic'],
      default: 'cricket',
    },
    formTemplate: {
      type: String,
      enum: ['cricket', 'futsal', 'padel', 'cycling', 'generic'],
      default: 'generic',
    },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    startDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    registrationType: {
      type: String,
      enum: ['individual', 'team', 'both'],
      default: 'individual',
    },
    pricePerPerson: {
      type: Number,
      default: 0,
    },
    pricePerTeam: {
      type: Number,
      default: 0,
    },
    amenities: [{
      type: String,
      trim: true,
    }],
    facilities: [{
      type: String,
      trim: true,
    }],
    maxParticipants: {
      type: Number,
    },
    minParticipants: {
      type: Number,
      default: 1,
    },
    images: [{
      url: {
        type: String,
        required: true,
      },
      caption: {
        type: String,
      },
      isPrimary: {
        type: Boolean,
        default: false,
      },
    }],
    totalParticipants: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    registrationDeadline: {
      type: Date,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    organizer: {
      type: String,
      required: true,
      trim: true,
    },
    contactInfo: {
      phone: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
EventSchema.index({ status: 1, startDate: 1 });
EventSchema.index({ eventType: 1 });
EventSchema.index({ isPublished: 1 });

const Event = models.Event || model<IEvent>('Event', EventSchema);

export default Event;
