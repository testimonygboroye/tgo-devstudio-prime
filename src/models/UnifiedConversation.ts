import { Schema, model, models, Document, Model, Types } from "mongoose";

export type ConversationKind = "direct" | "group" | "channel" | "whatsapp" | "ai";
export interface IUnifiedConversation extends Document {
  kind: ConversationKind;
  title: string;
  createdBy: Types.ObjectId;
  memberIds: Types.ObjectId[];
  aiAgentId?: Types.ObjectId;
  externalContactId?: string;
  externalContactName?: string;
  externalOptInAt?: Date;
  lastMessageAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
const ConversationSchema = new Schema<IUnifiedConversation>({
  kind: { type: String, enum: ["direct", "group", "channel", "whatsapp", "ai"], required: true, index: true },
  title: { type: String, trim: true, maxlength: 160, default: "" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  memberIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  aiAgentId: { type: Schema.Types.ObjectId, ref: "AIAgent" },
  externalContactId: { type: String, trim: true, maxlength: 80 },
  externalContactName: { type: String, trim: true, maxlength: 160 },
  externalOptInAt: Date,
  lastMessageAt: Date,
  archivedAt: Date,
}, { timestamps: true });
ConversationSchema.index({ memberIds: 1, lastMessageAt: -1 });
ConversationSchema.index({ kind: 1, externalContactId: 1 }, { unique: true, partialFilterExpression: { kind: "whatsapp", externalContactId: { $type: "string" } } });

export interface IUnifiedMessage extends Document {
  conversationId: Types.ObjectId;
  senderType: "human" | "ai" | "external" | "system";
  senderId?: Types.ObjectId;
  senderLabel: string;
  body: string;
  messageType: "text" | "audio" | "file" | "system";
  mediaUrl?: string;
  mimeType?: string;
  externalMessageId?: string;
  status: "sent" | "delivered" | "read" | "failed";
  threadRootId?: Types.ObjectId;
  editedAt?: Date;
  deletedAt?: Date;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
const MessageSchema = new Schema<IUnifiedMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: "UnifiedConversation", required: true, index: true },
  senderType: { type: String, enum: ["human", "ai", "external", "system"], required: true },
  senderId: { type: Schema.Types.ObjectId, ref: "User" },
  senderLabel: { type: String, trim: true, maxlength: 160, required: true },
  body: { type: String, trim: true, maxlength: 12000, default: "" },
  messageType: { type: String, enum: ["text", "audio", "file", "system"], default: "text" },
  mediaUrl: { type: String, maxlength: 2048 },
  mimeType: { type: String, maxlength: 120 },
  externalMessageId: { type: String, maxlength: 180, sparse: true },
  status: { type: String, enum: ["sent", "delivered", "read", "failed"], default: "sent" },
  threadRootId: { type: Schema.Types.ObjectId, ref: "UnifiedMessage" },
  editedAt: Date,
  deletedAt: Date,
  readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ externalMessageId: 1 }, { unique: true, sparse: true });

const UnifiedConversation: Model<IUnifiedConversation> = models.UnifiedConversation || model<IUnifiedConversation>("UnifiedConversation", ConversationSchema);
const UnifiedMessage: Model<IUnifiedMessage> = models.UnifiedMessage || model<IUnifiedMessage>("UnifiedMessage", MessageSchema);
export { UnifiedConversation, UnifiedMessage };
