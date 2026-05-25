// src/models/Notification.ts

import mongoose, { Document, Schema } from 'mongoose'

export type NotificationType = 'mention' | 'assignment' | 'reminder'

export interface INotification extends Document {
  user_id: number
  type: NotificationType
  title: string
  content: string
  note_content?: string | null   // preview nội dung ghi chú
  author_name?: string | null    // tên người tag
  ref_customer_id?: number | null
  ref_customer_name?: string | null
  is_read: boolean
  created_at: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    user_id:            { type: Number, required: true },
    type:               { type: String, enum: ['mention', 'assignment', 'reminder'], required: true },
    title:              { type: String, required: true },
    content:            { type: String, required: true },
    note_content:       { type: String, default: null },
    author_name:        { type: String, default: null },
    ref_customer_id:    { type: Number, default: null },
    ref_customer_name:  { type: String, default: null },
    is_read:            { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
)

// Index cho performance
NotificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 })

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema, 'notifications')