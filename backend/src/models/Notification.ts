// src/models/Notification.ts

import mongoose, { Document, Schema } from 'mongoose'

export type NotificationType = 'mention' | 'assignment' | 'reminder'

export interface INotification extends Document {
  user_id: number
  type: NotificationType
  content: string
  ref_customer_id?: number | null
  is_read: boolean
  created_at: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    user_id:         { type: Number, required: true },
    type:            { type: String, enum: ['mention', 'assignment', 'reminder'], required: true },
    content:         { type: String, required: true },
    ref_customer_id: { type: Number, default: null },
    is_read:         { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
)

// Index cho performance
NotificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 })

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema, 'notifications')