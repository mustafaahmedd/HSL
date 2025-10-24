import mongoose, { Schema, model, models } from 'mongoose';
import { IAuction, IBid, IAuctionSession } from '@/types/Auction';

// Auction Schema
const AuctionSchema = new Schema<IAuction>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    auctionDate: {
      type: Date,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
      default: 100,
    },
    biddingIncrement: {
      type: Number,
      required: true,
      default: 50,
    },
    timeLimitPerPlayer: {
      type: Number,
      required: true,
      default: 300, // 5 minutes
    },
    settings: {
      allowMultipleBids: {
        type: Boolean,
        default: true,
      },
      autoAssignOnTimeout: {
        type: Boolean,
        default: false,
      },
      requireMinimumBids: {
        type: Boolean,
        default: true,
      },
      minimumBidsRequired: {
        type: Number,
        default: 1,
      },
    },
    players: [{
      type: Schema.Types.ObjectId,
      ref: 'Player',
    }],
    teams: [{
      type: Schema.Types.ObjectId,
      ref: 'Team',
    }],
    totalRevenue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Bid Schema
const BidSchema = new Schema<IBid>(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isWinning: {
      type: Boolean,
      default: false,
    },
    bidderInfo: {
      teamName: {
        type: String,
        required: true,
      },
      ownerName: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Auction Session Schema (for live auction management)
const AuctionSessionSchema = new Schema<IAuctionSession>(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      unique: true,
    },
    currentPlayerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
    },
    biddingStartTime: {
      type: Date,
    },
    biddingEndTime: {
      type: Date,
    },
    currentHighestBid: {
      type: Schema.Types.ObjectId,
      ref: 'Bid',
    },
    biddingHistory: [{
      type: Schema.Types.ObjectId,
      ref: 'Bid',
    }],
    isActive: {
      type: Boolean,
      default: false,
    },
    sessionStats: {
      totalPlayers: {
        type: Number,
        default: 0,
      },
      playersSold: {
        type: Number,
        default: 0,
      },
      playersRemaining: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
AuctionSchema.index({ eventId: 1, status: 1 });
AuctionSchema.index({ auctionDate: 1 });
AuctionSchema.index({ status: 1 });

BidSchema.index({ auctionId: 1, playerId: 1 });
BidSchema.index({ teamId: 1 });
BidSchema.index({ timestamp: -1 });
BidSchema.index({ isWinning: 1 });

AuctionSessionSchema.index({ auctionId: 1 });
AuctionSessionSchema.index({ isActive: 1 });

// Virtual for calculating remaining time
AuctionSessionSchema.virtual('timeRemaining').get(function() {
  if (!this.biddingEndTime || !this.isActive) return 0;
  const now = new Date();
  const remaining = this.biddingEndTime.getTime() - now.getTime();
  return Math.max(0, Math.floor(remaining / 1000));
});

// Pre-save middleware for auction
AuctionSchema.pre('save', function(next) {
  // Update total revenue when auction is completed
  if (this.status === 'completed') {
    // This will be calculated from bids
  }
  next();
});

// Pre-save middleware for bid
BidSchema.pre('save', function(next) {
  // Ensure only one winning bid per player
  if (this.isWinning) {
    // This will be handled in the API logic
  }
  next();
});

const Auction = models.Auction || model<IAuction>('Auction', AuctionSchema);
const Bid = models.Bid || model<IBid>('Bid', BidSchema);
const AuctionSession = models.AuctionSession || model<IAuctionSession>('AuctionSession', AuctionSessionSchema);

export default Auction;
export { Bid, AuctionSession };
