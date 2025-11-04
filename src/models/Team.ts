import mongoose, { Schema, model, models } from 'mongoose';
import { ITeam } from '@/types/Team';

const TeamPlayerSchema = new Schema({
  registrationId: {
    type: Schema.Types.ObjectId,
    ref: 'Registration',
    required: true,
  },
}, { _id: false });

const AuctionTeamPlayerSchema = new Schema({
  registrationId: {
    type: Schema.Types.ObjectId,
    ref: 'Registration',
    required: true,
  },
  playerName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  transactionDate: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const TeamSchema = new Schema<ITeam>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ['tournament', 'competition', 'auction', 'activity'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    captain: {
      type: String,
      trim: true,
    },
    entry: {
      type: String,
      enum: ['paid', 'unpaid'],
    },
    entryAmount: {
      type: Number,
    },
    
    // Auction Event Fields
    owner: {
      type: String,
      trim: true,
    },
    totalPoints: {
      type: Number,
    },
    pointsSpent: {
      type: Number,
      default: 0,
    },
    pointsLeft: {
      type: Number,
    },
    maxPlayers: {
      type: Number,
    },
    // Players array - schema depends on eventType
    players: {
      type: Schema.Types.Mixed,
      default: [],
    },
    // Common fields
    status: {
      type: String,
      enum: ['active', 'eliminated', 'winner', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
TeamSchema.index({ eventId: 1, status: 1 });
TeamSchema.index({ eventId: 1, eventType: 1 });
TeamSchema.index({ title: 1 });

// Pre-save middleware to calculate pointsLeft for auction teams
TeamSchema.pre('save', function (next) {
  // 'this' is a Mongoose Document. Cast it to any to avoid type errors.
  const doc = this as any;
  if (doc.eventType === 'auction' && doc.totalPoints !== undefined) {
    doc.pointsLeft = doc.totalPoints - (doc.pointsSpent || 0);
  }
  next();
});

// Virtual for team title with event
TeamSchema.virtual('displayName').get(function(this: any) {
  return `${this.title}`;
});

// Method to add player to team
TeamSchema.methods.addPlayer = function(this: any, playerData: any) {
  this.players.push(playerData);
  if (this.eventType === 'auction' && playerData.purchasePrice) {
    this.pointsSpent = (this.pointsSpent || 0) + playerData.purchasePrice;
    this.pointsLeft = (this.totalPoints || 0) - this.pointsSpent;
  }
  return this.save();
};

// Method to remove player from team
TeamSchema.methods.removePlayer = function(registrationId: string) {
  const playerIndex = this.players.findIndex(
    (p: any) => p.registrationId.toString() === registrationId
  );
  
  if (playerIndex > -1) {
    const player = this.players[playerIndex];
    this.players.splice(playerIndex, 1);
    
    if (this.eventType === 'auction' && player.purchasePrice) {
      this.pointsSpent = (this.pointsSpent || 0) - player.purchasePrice;
      this.pointsLeft = (this.totalPoints || 0) - this.pointsSpent;
    }
  }
  
  return this.save();
};

const Team = models.Team || model<ITeam>('Team', TeamSchema);

export default Team;
