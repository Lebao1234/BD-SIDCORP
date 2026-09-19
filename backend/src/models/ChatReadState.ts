import mongoose, { Document, Schema } from 'mongoose'

/**
 * Mốc "đã đọc tới đâu" của một người trong một cuộc hội thoại.
 *
 * Trước đây hệ thống không lưu trạng thái đọc ở đâu cả: số tin chưa đọc chỉ
 * nằm trong localStorage của từng trình duyệt. Hệ quả là tin nhắn đến lúc
 * người dùng offline không để lại dấu vết nào — sự kiện socket bị bỏ lỡ hẳn, và
 * khi đăng nhập lại thì không có cách nào biết có ai đã nhắn. Badge cũng không
 * đồng bộ giữa máy tính và điện thoại, và mất sạch khi xoá dữ liệu trình duyệt.
 *
 * CÁCH LƯU: một mốc thời gian cho mỗi cặp (người đọc, đối phương), thay vì một
 * cờ `is_read` trên từng tin nhắn. Đánh dấu đã đọc cả cuộc hội thoại khi đó là
 * một lần ghi duy nhất chứ không phải cập nhật hàng loạt, và đếm số chưa đọc
 * chỉ là một câu đếm theo `created_at > last_read_at`.
 *
 * QUY ƯỚC: `peer_id = 0` là kênh diễn đàn chung, khớp với quy ước `receiver_id
 * = 0` của GlobalMessage.
 */

export interface IChatReadState extends Document {
  user_id: number
  peer_id: number
  last_read_at: Date
}

const ChatReadStateSchema = new Schema<IChatReadState>(
  {
    user_id:      { type: Number, required: true },
    peer_id:      { type: Number, required: true },
    last_read_at: { type: Date,   required: true, default: Date.now }
  },
  { versionKey: false }
)

// Mỗi cặp (người đọc, đối phương) chỉ có đúng một bản ghi. Ràng buộc unique ở
// đây là thứ khiến thao tác upsert an toàn khi người dùng mở nhiều tab cùng lúc.
ChatReadStateSchema.index({ user_id: 1, peer_id: 1 }, { unique: true })

export const ChatReadState = mongoose.model<IChatReadState>(
  'ChatReadState',
  ChatReadStateSchema,
  'chat_read_states'
)
