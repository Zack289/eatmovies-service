import { Request } from "express";
import { Document, Types } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

export type MediaType = "movie" | "series";

export interface IMedia extends Document {
  _id: Types.ObjectId;
  title: string;
  normalizedTitle: string;
  type: MediaType;
  poster: string;
  posterPublicId?: string;
  description: string;
  genres: string[];
  countries: string[];
  industry?: string;
  releaseYear?: number;
  startYear?: number;
  endYear?: number | null;
  ongoing?: boolean;
  addedBy: Types.ObjectId;
  status: "published" | "hidden";
  favoriteCount: number;
  watchedCount: number;
  wishlistCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type InteractionKind = "favorite" | "watched" | "wishlist";

export interface IInteraction extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  media: Types.ObjectId;
  kind: InteractionKind;
  createdAt: Date;
}

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    name: string;
    email: string;
  };
}
