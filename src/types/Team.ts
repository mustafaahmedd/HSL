import { Types } from 'mongoose';
import { IPlayer } from './Player';

export interface ITeam {
  _id?: Types.ObjectId;
  name: string;
  owner: string;
  captainId?: Types.ObjectId;
  totalBudget: number;
  pointsSpent: number;
  pointsLeft: number;
  players: Types.ObjectId[] | IPlayer[];
  squadCapByCategory: {
    [category: string]: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITeamWithPlayers extends Omit<ITeam, 'players'> {
  players: IPlayer[];
}

export interface ITeamStats {
  totalPlayers: number;
  playersByCategory: {
    [category: string]: number;
  };
  playersByType: {
    [type: string]: number;
  };
}
