import mongoose, { Schema, model, models } from 'mongoose';

export interface IEvent {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  eventType: 'tournament' | 'activity' | 'event' | 'competition';
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
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
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    name: {
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
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
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
      email: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      whatsapp: {
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
