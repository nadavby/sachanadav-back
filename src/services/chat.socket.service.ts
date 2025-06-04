import { Server, Socket } from 'socket.io';
import { ChatMessage, IChatMessage } from '../models/chat_model';

export const initChatSocket = (io: Server) => {
  // Create a namespace for chat
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket: Socket) => {
    console.log('[CHAT SOCKET] New connection:', socket.id);

    // Join a chat room based on matchId
    socket.on('join_chat', async (matchId: string) => {
      socket.join(matchId);
      console.log(`[CHAT SOCKET] Client ${socket.id} joined chat room: ${matchId}`);

      // Load and send chat history
      try {
        const messages = await ChatMessage.find({ matchId })
          .sort({ timestamp: 1 })
          .limit(100)
          .lean();
        socket.emit('chat_history', messages);
      } catch (error) {
        console.error('[CHAT SOCKET] Error loading chat history:', error);
        socket.emit('error', { message: 'Failed to load chat history' });
      }
    });

    // Handle new messages
    socket.on('send_message', async (data: {
      matchId: string;
      senderId: string;
      content: string;
    }) => {
      try {
        // Create and save the message
        const message = new ChatMessage({
          matchId: data.matchId,
          senderId: data.senderId,
          content: data.content
        });
        await message.save();

        // Broadcast to all clients in the room
        chatNamespace.to(data.matchId).emit('new_message', message);
      } catch (error) {
        console.error('[CHAT SOCKET] Error saving message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message status updates
    socket.on('update_message_status', async (data: {
      messageId: string;
      status: 'delivered' | 'read';
    }) => {
      try {
        const message = await ChatMessage.findByIdAndUpdate(
          data.messageId,
          { status: data.status },
          { new: true }
        );
        if (message) {
          chatNamespace.to(message.matchId).emit('message_status_updated', {
            messageId: message._id,
            status: data.status
          });
        }
      } catch (error) {
        console.error('[CHAT SOCKET] Error updating message status:', error);
      }
    });

    // Leave chat room
    socket.on('leave_chat', (matchId: string) => {
      socket.leave(matchId);
      console.log(`[CHAT SOCKET] Client ${socket.id} left chat room: ${matchId}`);
    });

    socket.on('disconnect', () => {
      console.log('[CHAT SOCKET] Disconnected:', socket.id);
    });
  });

  return chatNamespace;
}; 