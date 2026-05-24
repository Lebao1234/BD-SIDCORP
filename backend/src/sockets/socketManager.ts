import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { GlobalMessage } from '../models/GlobalMessage';

// Map lưu trữ: userId -> socket.id
const userSocketMap = new Map<string, string>();

let io: Server;

// ── Helper: Broadcast danh sách online cho tất cả clients ────────────────────
const broadcastOnlineUsers = () => {
  if (!io) return;
  const onlineUserIds = Array.from(userSocketMap.keys());
  io.emit('online_users', onlineUserIds);
};

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
      broadcastOnlineUsers();
    }

    // Đăng ký lại thủ công nếu cần
    socket.on('register', (rUserId: string) => {
      if (rUserId) {
        userSocketMap.set(rUserId, socket.id);
        console.log(`User đăng ký lại: ${rUserId} (SocketID: ${socket.id})`);
        broadcastOnlineUsers();
      }
    });

    // Client yêu cầu danh sách online hiện tại
    socket.on('get_online_users', () => {
      const onlineUserIds = Array.from(userSocketMap.keys());
      socket.emit('online_users', onlineUserIds);
    });

    // ── Tin nhắn trực tiếp (DM) ──────────────────────────────────────────────
    socket.on('send_message', async (data: { senderId: string; senderName: string; receiverId: string; content: string }) => {
      const { senderId, senderName, receiverId, content } = data;
      try {
        const newMsg = await GlobalMessage.create({
          sender_id: senderId,
          sender_name: senderName,
          receiver_id: receiverId,
          content,
          created_at: new Date()
        });

        // Gửi cho người nhận
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', newMsg);
        }
        
        // Xác nhận cho người gửi
        socket.emit('message_sent', newMsg);
      } catch (err) {
        console.error('Lỗi gửi tin nhắn socket:', err);
        socket.emit('error_message', { message: 'Không thể gửi tin nhắn' });
      }
    });

    // ── Tin nhắn Diễn đàn (Forum) ────────────────────────────────────────────
    socket.on('send_forum_message', async (data: { senderId: string; senderName: string; content: string }) => {
      const { senderId, senderName, content } = data;
      try {
        // receiver_id = 0 là quy ước cho kênh forum nhóm
        const newMsg = await GlobalMessage.create({
          sender_id: Number(senderId),
          sender_name: senderName,
          receiver_id: 0,
          content,
          created_at: new Date()
        });

        // Broadcast cho TẤT CẢ clients đang kết nối
        io.emit('forum_message', newMsg);
      } catch (err) {
        console.error('Lỗi gửi tin nhắn forum:', err);
        socket.emit('error_message', { message: 'Không thể gửi tin nhắn diễn đàn' });
      }
    });

    // ── Hủy kết nối ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      for (const [uid, sid] of userSocketMap.entries()) {
        if (sid === socket.id) {
          userSocketMap.delete(uid);
          console.log(`User ngắt kết nối Socket: ${uid}`);
          break;
        }
      }
      broadcastOnlineUsers();
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
    return true;
  }
  return false;
};

// Lấy danh sách các User đang online
export const getOnlineUsers = () => {
  return Array.from(userSocketMap.keys());
};
