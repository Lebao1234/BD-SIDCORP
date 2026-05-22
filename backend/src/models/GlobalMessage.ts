// src/models/GlobalMessage.ts

import mongoose, { Document, Schema } from 'mongoose'

export interface IReaction {
  user_id: number
  emoji: string
  reacted_at: Date
}

export interface IGlobalMessage extends Document {
  sender_id: number
  content: string
  file_url?: string | null
  reactions: IReaction[]
  reply_to?: mongoose.Types.ObjectId | null
  created_at: Date
  updated_at: Date
}

const ReactionSchema = new Schema<IReaction>(
  {
    user_id:    { type: Number, required: true },
    emoji:      { type: String, required: true },
    reacted_at: { type: Date, default: Date.now }
  },
  { _id: false }
)

const GlobalMessageSchema = new Schema<IGlobalMessage>(
  {
    sender_id: { type: Number, required: true },
    content:   { type: String, required: true },
    file_url:  { type: String, default: null },
    reactions: { type: [ReactionSchema], default: [] },
    reply_to:  { type: Schema.Types.ObjectId, ref: 'GlobalMessage', default: null }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
)

export const GlobalMessage = mongoose.model<IGlobalMessage>('GlobalMessage', GlobalMessageSchema, 'global_messages')