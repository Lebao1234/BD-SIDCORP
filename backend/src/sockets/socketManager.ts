import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { GlobalMessage } from '../models/GlobalMessage';
import { corsOriginHandler } from '../config/cors';
import { createRedisPair } from '../config/redis';

// Định danh đã xác thực, gắn vào socket sau khi verify JWT
interface SocketUser {
  id:   number;
  name: string;
  role: string;
}

declare module 'socket.io' {
  interface Socket {
    authUser?: SocketUser;
  }
}

// Trần độ dài một tin nhắn.
//
// Trước đây server chỉ kiểm tra nội dung có rỗng hay không, không có giới hạn
// trên nào. Rào chắn duy nhất là `maxHttpBufferSize` mặc định 1MB của Socket.io
// — nghĩa là một client sửa đổi có thể nhét gần một megabyte văn bản vào MỘT
// tin nhắn, ghi thẳng vào MongoDB rồi phát cho mọi người đang online.
const MAX_MESSAGE_LENGTH = 4000;

// Quy ước dùng chung với ChatController: receiver_id = 0 là kênh diễn đàn.
const FORUM_RECEIVER_ID = 0;

// Kiểm tra nội dung dùng chung cho cả tin nhắn riêng lẫn diễn đàn.
// Trả về thông báo lỗi, hoặc null nếu hợp lệ.
const validateMessageBody = (content?: string, fileUrl?: string): string | null => {
  const text = (content ?? '').trim();

  if (!text && !fileUrl) return 'Nội dung tin nhắn trống';
  if (text.length > MAX_MESSAGE_LENGTH) {
    return `Tin nhắn quá dài (tối đa ${MAX_MESSAGE_LENGTH} ký tự).`;
  }
  return null;
};

// Map lưu trữ: userId -> tập socket.id (1 user có thể mở nhiều tab/thiết bị)
const userSocketMap = new Map<string, Set<string>>();

let io: Server;

// ── Helper: Broadcast danh sách online cho tất cả clients ────────────────────
const broadcastOnlineUsers = () => {
  if (!io) return;
  io.emit('online_users', Array.from(userSocketMap.keys()));
};

const addUserSocket = (userId: string, socketId: string) => {
  const existing = userSocketMap.get(userId);
  if (existing) {
    existing.add(socketId);
  } else {
    userSocketMap.set(userId, new Set([socketId]));
  }
};

const removeUserSocket = (socketId: string): string | null => {
  for (const [uid, sockets] of userSocketMap.entries()) {
    if (sockets.delete(socketId)) {
      // Chỉ coi là offline khi user không còn kết nối nào
      if (sockets.size === 0) userSocketMap.delete(uid);
      return uid;
    }
  }
  return null;
};

// Gửi một event tới mọi kết nối của user
const emitToUser = (userId: string, event: string, payload: unknown): boolean => {
  const sockets = userSocketMap.get(userId);
  if (!sockets || sockets.size === 0) return false;
  for (const socketId of sockets) {
    io.to(socketId).emit(event, payload);
  }
  return true;
};

// ── Xác thực JWT trước khi cho phép kết nối ──────────────────────────────────
// Token lấy từ handshake.auth.token (ưu tiên) hoặc header Authorization.
// KHÔNG bao giờ tin userId do client tự khai báo.
const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
  const rawToken =
    (socket.handshake.auth?.token as string | undefined) ||
    (socket.handshake.headers.authorization || '').replace(/^Bearer\s+/i, '');

  if (!rawToken) {
    return next(new Error('Từ chối kết nối: Chưa cung cấp token.'));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET chưa được cấu hình — từ chối mọi kết nối socket.');
    return next(new Error('Máy chủ chưa cấu hình xác thực.'));
  }

  try {
    const decoded = jwt.verify(rawToken, secret) as Record<string, unknown>;

    // Tương thích ngược với token cũ lưu id dạng "TK-001"
    const rawId = decoded.id;
    const parsedId = typeof rawId === 'string'
      ? parseInt(rawId.replace(/^[A-Za-z]+-/, ''), 10)
      : parseInt(String(rawId), 10);

    if (!parsedId || isNaN(parsedId)) {
      return next(new Error('Token không hợp lệ: thiếu định danh người dùng.'));
    }

    socket.authUser = {
      id:   parsedId,
      name: typeof decoded.name === 'string' ? decoded.name : '',
      role: typeof decoded.role === 'string' ? decoded.role : 'user'
    };

    return next();
  } catch {
    return next(new Error('Token không hợp lệ hoặc đã hết hạn.'));
  }
};

export const initSocket = async (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: corsOriginHandler,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Adapter Redis cho phép nhiều instance cùng phục vụ socket: một tin nhắn
  // phát ở instance A tới được người đang kết nối vào instance B. Không cấu
  // hình REDIS_URL thì bỏ qua và chạy một instance như trước.
  const redis = await createRedisPair();
  if (redis) {
    const { createAdapter } = await import('@socket.io/redis-adapter');
    io.adapter(createAdapter(redis.pubClient, redis.subClient));
    console.log('Socket.io           : dùng Redis adapter (chạy được nhiều instance)');
  } else {
    console.log('Socket.io           : chế độ một instance (chưa cấu hình REDIS_URL)');
  }

  io.use(authenticateSocket);

  io.on('connection', (socket: Socket) => {
    const authUser = socket.authUser;
    if (!authUser) {
      socket.disconnect(true);
      return;
    }

    const userId = String(authUser.id);
    addUserSocket(userId, socket.id);
    console.log(`User kết nối Socket: ${userId} (SocketID: ${socket.id})`);
    broadcastOnlineUsers();

    // Client yêu cầu danh sách online hiện tại
    socket.on('get_online_users', () => {
      socket.emit('online_users', Array.from(userSocketMap.keys()));
    });

    // Giữ lại để tương thích với client cũ — định danh vẫn lấy từ token
    socket.on('register', () => {
      addUserSocket(userId, socket.id);
      broadcastOnlineUsers();
    });

    // ── Tin nhắn trực tiếp (DM) ──────────────────────────────────────────────
    // senderId/senderName do client gửi lên bị bỏ qua: luôn dùng định danh đã xác thực.
    socket.on('send_message', async (data: { receiverId: string | number; content: string; fileUrl?: string }) => {
      const { receiverId, content, fileUrl } = data ?? {};

      const receiver = Number(receiverId);
      if (!receiver || isNaN(receiver)) {
        return socket.emit('error_message', { message: 'Người nhận không hợp lệ' });
      }
      const invalid = validateMessageBody(content, fileUrl);
      if (invalid) {
        return socket.emit('error_message', { message: invalid });
      }

      try {
        const newMsg = await GlobalMessage.create({
          sender_id:   authUser.id,
          sender_name: authUser.name,
          receiver_id: receiver,
          content:     content ?? '',
          file_url:    fileUrl || null
        });

        // Gửi cho người nhận (mọi thiết bị đang mở)
        emitToUser(String(receiver), 'receive_message', newMsg);

        // Đồng bộ sang các tab khác của chính người gửi
        for (const sid of userSocketMap.get(userId) ?? []) {
          if (sid !== socket.id) io.to(sid).emit('receive_message', newMsg);
        }

        socket.emit('message_sent', newMsg);
      } catch (err) {
        console.error('Lỗi gửi tin nhắn socket:', err);
        socket.emit('error_message', { message: 'Không thể gửi tin nhắn' });
      }
    });

    // ── Tin nhắn Diễn đàn (Forum) ────────────────────────────────────────────
    socket.on('send_forum_message', async (data: { content: string; fileUrl?: string }) => {
      const { content, fileUrl } = data ?? {};

      const invalid = validateMessageBody(content, fileUrl);
      if (invalid) {
        return socket.emit('error_message', { message: invalid });
      }

      try {
        const newMsg = await GlobalMessage.create({
          sender_id:   authUser.id,
          sender_name: authUser.name,
          receiver_id: FORUM_RECEIVER_ID,
          content:     content ?? '',
          file_url:    fileUrl || null
        });

        // Broadcast cho TẤT CẢ clients đang kết nối
        io.emit('forum_message', newMsg);
      } catch (err) {
        console.error('Lỗi gửi tin nhắn forum:', err);
        socket.emit('error_message', { message: 'Không thể gửi tin nhắn diễn đàn' });
      }
    });

    // ── Thu hồi tin nhắn ──────────────────────────────────────────────────────
    // Chỉ người gửi hoặc admin mới được thu hồi.
    socket.on('revoke_message', async (data: { messageId: string }) => {
      const { messageId } = data ?? {};
      if (!messageId) return;

      try {
        const msg = await GlobalMessage.findById(messageId);
        if (!msg) return;

        const isOwner = Number(msg.sender_id) === authUser.id;
        if (!isOwner && authUser.role !== 'admin') {
          return socket.emit('error_message', { message: 'Bạn không có quyền thu hồi tin nhắn này' });
        }

        msg.is_revoked = true;
        await msg.save();

        // Chỉ báo cho những người thực sự nhìn thấy tin nhắn đó. Bản cũ dùng
        // `io.emit` phát cho TOÀN BỘ client đang kết nối, kể cả người không
        // liên quan gì tới đoạn chat — vừa thừa băng thông, vừa để lộ ra rằng
        // vừa có một tin nhắn nào đó bị thu hồi ở đâu đó trong hệ thống.
        const payload = { messageId };

        if (Number(msg.receiver_id) === FORUM_RECEIVER_ID) {
          io.emit('message_revoked', payload); // diễn đàn thì đúng là mọi người
        } else {
          emitToUser(String(msg.sender_id), 'message_revoked', payload);
          emitToUser(String(msg.receiver_id), 'message_revoked', payload);
        }
      } catch (err) {
        console.error('Lỗi thu hồi tin nhắn:', err);
      }
    });

    // ── Hủy kết nối ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const removed = removeUserSocket(socket.id);
      if (removed && !userSocketMap.has(removed)) {
        console.log(`User ngắt kết nối Socket: ${removed}`);
      }
      broadcastOnlineUsers();
    });
  });

  return io;
};

// Hàm gửi thông báo tức thời tới User cụ thể
export const sendRealtimeNotification = (userId: string, notification: unknown): boolean => {
  if (!io) return false;
  return emitToUser(String(userId), 'notification', notification);
};

// Gửi một sự kiện bất kỳ tới mọi kết nối của một user, dùng từ tầng HTTP.
// Cần cho việc báo "đối phương vừa đọc tin của bạn": thao tác đánh dấu đã đọc
// đi qua REST, nhưng dấu đã xem ở màn hình người gửi phải đổi ngay.
export const emitEventToUser = (userId: string | number, event: string, payload: unknown): boolean => {
  if (!io) return false;
  return emitToUser(String(userId), event, payload);
};

// Lấy danh sách các User đang online
export const getOnlineUsers = () => Array.from(userSocketMap.keys());
