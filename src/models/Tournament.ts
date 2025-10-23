import mongoose, { Schema, model, models } from 'mongoose';
import { ITournament } from '@/types/Tournament';

const TournamentSchema = new Schema<ITournament>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['tournament', 'activity', 'event', 'competition'],
      default: 'tournament',
    },
    status: {
      type: String,
      enum: ['registration', 'setup', 'live', 'completed'],
      default: 'registration',
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
      url: String,
      caption: String,
      isPrimary: { type: Boolean, default: false },
    }],
    totalParticipants: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    // Legacy fields for auction tournaments
    minBidByCategory: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    squadCapByCategory: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Convert Map to plain object when converting to JSON
TournamentSchema.set('toJSON', {
  transform: function(doc, ret) {
    if (ret.minBidByCategory instanceof Map) {
      ret.minBidByCategory = Object.fromEntries(ret.minBidByCategory);
    }
    if (ret.squadCapByCategory instanceof Map) {
      ret.squadCapByCategory = Object.fromEntries(ret.squadCapByCategory);
    }
    return ret;
  }
});

const Tournament = models.Tournament || model<ITournament>('Tournament', TournamentSchema);

export default Tournament;
