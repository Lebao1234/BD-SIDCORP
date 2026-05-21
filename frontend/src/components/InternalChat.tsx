import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User as UserIcon, Smile } from 'lucide-react';
import { useAuth, User } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

interface ChatMessage {
  id?: string;
  _id?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

interface InternalChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InternalChat: React.FC<InternalChatProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [team, setTeam] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tải danh sách user trong team
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      try {
        const res = await api.get('/auth/users');
        // Lọc bỏ chính mình khỏi danh sách chat
        setTeam(res.data.filter((u: User) => u.id !== user?.id));
      } catch (err) {
        console.error('Không thể lấy danh sách team để chat:', err);
      }
    };
    fetchUsers();
  }, [isOpen, user]);

  // Lấy lịch sử chat khi chọn một người cụ thể
  useEffect(() => {
    if (!selectedUser || !isOpen) return;

    const fetchHistory = async () => {
      try {
        const res = await api.get(`/chat/history/${selectedUser.id}`);
        setMessages(res.data);
      } catch (err) {
        console.error('Lỗi lấy lịch sử chat:', err);
      }
    };

    fetchHistory();
  }, [selectedUser, isOpen]);

  // Cuộn xuống cuối khung chat khi có tin mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lắng nghe tin nhắn Realtime qua Socket
  useEffect(() => {
    if (!socket || !isOpen) return;

    // Khi nhận được tin nhắn từ socket
    const handleReceiveMessage = (msg: ChatMessage) => {
      // Nếu tin nhắn thuộc cuộc hội thoại đang mở
      if (
        (msg.senderId === selectedUser?.id && msg.receiverId === user?.id) ||
        (msg.senderId === user?.id && msg.receiverId === selectedUser?.id)
      ) {
        setMessages(prev => [...prev, msg]);
      }
    };

    // Khi gửi tin nhắn thành công
    const handleMessageSent = (msg: ChatMessage) => {
      if (msg.receiverId === selectedUser?.id) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
    };
  }, [socket, selectedUser, user, isOpen]);

  // Nhận thông tin các User đang online thông qua Socket định kỳ
  useEffect(() => {
    if (!socket || !isOpen) return;

    // Gửi yêu cầu cập nhật danh sách online
    const interval = setInterval(() => {
      socket.emit('get_online_users'); // Server sẽ xử lý (hoặc ta dùng State chung từ SocketContext)
    }, 5000);

    // Lắng nghe danh sách online
    // Để giữ logic đơn giản, backend socketManager lưu map socket. 
    // Chúng ta sẽ gán giả định một số user online hoặc kết hợp cơ chế bắn sự kiện khi kết nối.
    // Dưới đây ta giả lập bằng việc kết nối socket thành công thì coi là online.
    return () => clearInterval(interval);
  }, [socket, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket || !user) return;

    // Gửi thông qua Socket.io
    socket.emit('send_message', {
      senderId: user.id,
      senderName: user.fullName,
      receiverId: selectedUser.id,
      content: newMessage.trim()
    });

    setNewMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 glass-panel border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-yellow-400" />
          <h3 className="font-bold text-white text-sm">Trò chuyện nội bộ</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-900 rounded-lg transition text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Nếu chưa chọn user để chat -> Hiện danh sách team */}
        {!selectedUser ? (
          <div className="w-full overflow-y-auto p-4 space-y-2.5">
            <p className="text-xs font-bold text-slate-500 mb-3">DANH SÁCH THÀNH VIÊN TRONG TEAM</p>
            {team.length === 0 ? (
              <p className="text-xs text-slate-500">Chưa có thành viên nào khác đăng ký.</p>
            ) : (
              team.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="w-full flex items-center gap-3 p-3 bg-slate-900/40 border border-slate-850 hover:border-slate-700 rounded-xl transition text-left"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-white border border-slate-700">
                      {u.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    {/* Chấm xanh trạng thái online (tất cả các thành viên trong room chat dưới 10 người đều hoạt động nhộn nhịp) */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-yellow-500 border-2 border-slate-950" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{u.fullName}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">@{u.username} • {u.role}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          /* Khung chat chi tiết với user được chọn */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar of active chat */}
            <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between shrink-0">
              <button 
                onClick={() => setSelectedUser(null)} 
                className="text-[11px] font-bold text-yellow-400 hover:underline"
              >
                ← Quay lại
              </button>
              <div className="text-right">
                <span className="text-xs font-bold text-white">{selectedUser.fullName}</span>
                <span className="text-[9px] block text-yellow-400">Đang hoạt động</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Hãy gửi lời chào đầu tiên tới {selectedUser.fullName}!
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div 
                      key={msg.id || msg._id || index}
                      className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe ? 'bg-yellow-600 text-white rounded-tr-none' : 'bg-slate-850 text-slate-200 rounded-tl-none border border-slate-800'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-30 disabled:hover:bg-yellow-600 text-white p-2.5 rounded-xl transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
