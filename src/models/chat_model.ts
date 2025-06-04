import mongoose, { Document, Schema } from 'mongoose';

interface IChatMessage extends Document {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);

export default ChatMessage;