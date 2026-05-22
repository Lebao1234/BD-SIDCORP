import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { GlobalMessage } from '../models/GlobalMessage';

// Map lưu trữ: userId -> socket.id
const userSocketMap = new Map<string, string>();

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Trong production, bạn nên config domain cụ thể của Vercel
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    
    if (userId && userId !== 'undefined') {
      userSocketMap.set(userId, socket.id);
      console.log(`User kết nối Socket: ${userId} (SocketID: ${socket.id})`);
    }

    // Đăng ký lại thủ công nếu cần
    socket.on('register', (rUserId: string) => {
      if (rUserId) {
        userSocketMap.set(rUserId, socket.id);
        console.log(`User đăng ký lại: ${rUserId} (SocketID: ${socket.id})`);
      }
    });

    // Lắng nghe sự kiện nhắn tin trực tiếp
    socket.on('send_message', async (data: { senderId: string; senderName: string; receiverId: string; content: string }) => {
      const { senderId, senderName, receiverId, content } = data;
      try {
        // Lưu tin nhắn vào MongoDB Atlas
        const newMsg = await GlobalMessage.create({
          sender_id: senderId,
          sender_name: senderName,
          receiver_id: receiverId,
          content,
          created_at: new Date()
        });

        // Tìm socketId của người nhận
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
          // Gửi tin nhắn tức thời cho người nhận
          io.to(receiverSocketId).emit('receive_message', newMsg);
        }
        
        // Gửi xác nhận lại cho người gửi
        socket.emit('message_sent', newMsg);
      } catch (err) {
        console.error('Lỗi gửi tin nhắn socket:', err);
        socket.emit('error_message', { message: 'Không thể gửi tin nhắn' });
      }
    });

    // Hủy kết nối
    socket.on('disconnect', () => {
      for (const [uid, sid] of userSocketMap.entries()) {
        if (sid === socket.id) {
          userSocketMap.delete(uid);
          console.log(`User ngắt kết nối Socket: ${uid}`);
          break;
        }
      }
    });
  });

  return io;
};

// Hàm gửi thông báo tức thời tới User cụ thể
export const sendRealtimeNotification = (userId: string, notification: any) => {
  if (!io) return false;
  const socketId = userSocketMap.get(userId);
  if (socketId) {
    io.to(socketId).emit('notification', notification);
    return true; // Gửi online thành công
  }
  return false; // User đang offline
};

// Lấy danh sách các User đang online (dùng để hiển thị trạng thái)
export const getOnlineUsers = () => {
  return Array.from(userSocketMap.keys());
};
