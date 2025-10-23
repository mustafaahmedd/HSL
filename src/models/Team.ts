import mongoose, { Schema, model, models } from 'mongoose';
import { ITeam } from '@/types/Team';

const TeamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    owner: {
      type: String,
      required: true,
      trim: true,
    },
    captainId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
    },
    totalBudget: {
      type: Number,
      required: true,
      default: 8000,
    },
    pointsSpent: {
      type: Number,
      required: true,
      default: 0,
    },
    pointsLeft: {
      type: Number,
      required: true,
      default: 8000,
    },
    players: [{
      type: Schema.Types.ObjectId,
      ref: 'Player',
    }],
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

// Virtual for calculating points left
TeamSchema.virtual('calculatedPointsLeft').get(function() {
  return this.totalBudget - this.pointsSpent;
});

// Pre-save middleware to update pointsLeft
TeamSchema.pre('save', function(next) {
  this.pointsLeft = this.totalBudget - this.pointsSpent;
  next();
});

// Convert Map to plain object when converting to JSON
TeamSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    if (ret.squadCapByCategory instanceof Map) {
      ret.squadCapByCategory = Object.fromEntries(ret.squadCapByCategory);
    }
    return ret;
  }
});

const Team = models.Team || model<ITeam>('Team', TeamSchema);

export default Team;
