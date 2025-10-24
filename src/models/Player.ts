import mongoose, { Schema, model, models } from 'mongoose';
import { IPlayer } from '@/types/Player';

const PlayerSchema = new Schema<IPlayer>(
  {
    // Registration Form Fields
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
      required: true,
    },
    playBothTournaments: {
      type: Boolean,
      default: false,
    },
    skillLevel: {
      type: String,
      trim: true,
      default: 'Beginner',
    },
    iconPlayerRequest: {
      type: Boolean,
      default: false,
    },
    selfAssignedCategory: {
      type: String,
      trim: true,
      default: 'Bronze',
    },
    photoUrl: {
      type: String,
      required: true,
    },
    
    // Admin Override Fields
    type: {
      type: String,
      enum: ['Batsman', 'Bowler', 'Batting All Rounder', 'Bowling All Rounder'],
    },
    category: {
      type: String,
      enum: ['Platinum', 'Diamond', 'Gold', 'Silver', 'Bronze'],
    },
    
    // Auction Related Fields
    status: {
      type: String,
      enum: ['available', 'sold'],
      default: 'available',
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    role: {
      type: String,
      enum: ['Player', 'Captain'],
      default: 'Player',
    },
    bidPrice: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
PlayerSchema.index({ status: 1, category: 1 });
PlayerSchema.index({ teamId: 1 });

const Player = models.Player || model<IPlayer>('Player', PlayerSchema);

export default Player;
