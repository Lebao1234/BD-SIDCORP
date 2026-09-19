// src/models/GlobalMessage.ts

import mongoose, { Document, Schema } from 'mongoose'

export interface IReaction {
  user_id: number
  emoji: string
  reacted_at: Date
}

export interface IGlobalMessage extends Document {
  sender_id: number
  sender_name: string
  receiver_id: number
  content: string
  file_url?: string | null
  is_revoked?: boolean
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
    sender_id:   { type: Number, required: true },
    sender_name: { type: String, required: true },
    receiver_id: { type: Number, required: true },
    // KHÔNG required: socket cho phép gửi tin nhắn chỉ có tệp đính kèm, mà
    // validator `required` của mongoose coi chuỗi rỗng là thiếu giá trị. Hai
    // bên mâu thuẫn nhau khiến mọi tin nhắn dạng đó bị từ chối ở tầng model.
    // Ràng buộc "không được rỗng cả nội dung lẫn tệp" nằm ở socketManager.
    content:     { type: String, default: '' },
    file_url:    { type: String, default: null },
    is_revoked:  { type: Boolean, default: false },
    reactions:   { type: [ReactionSchema], default: [] },
    reply_to:    { type: Schema.Types.ObjectId, ref: 'GlobalMessage', default: null }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
)

// Compound indexes để tối ưu truy vấn lịch sử chat và đếm tin chưa đọc
GlobalMessageSchema.index({ sender_id: 1, receiver_id: 1, created_at: -1 });
GlobalMessageSchema.index({ receiver_id: 1, created_at: -1 });

// Phục vụ nhánh { sender_id: userId } của aggregation gom hội thoại. Index phía
// trên bắt đầu bằng cặp (sender_id, receiver_id) nên không sắp xếp được theo
// created_at khi chỉ lọc theo mình sender_id.
GlobalMessageSchema.index({ sender_id: 1, created_at: -1 });

export const GlobalMessage = mongoose.model<IGlobalMessage>('GlobalMessage', GlobalMessageSchema, 'global_messages')