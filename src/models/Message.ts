import { Schema, model, models, Document, Model, Types } from "mongoose";

export type MessageType = "roleChangeRequest" | "general";

export interface IMessage extends Document {
  recipient: Types.ObjectId;
  type: MessageType;
  title: string;
  body: string;
  relatedId?: Types.ObjectId;
  status: "new" | "read" | "unread" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["roleChangeRequest", "general"], default: "general" },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    relatedId: { type: Schema.Types.ObjectId },
    status: { type: String, enum: ["new", "read", "unread", "archived"], default: "new" },
  },
  { timestamps: true }
);

const Message: Model<IMessage> = models.Message || model<IMessage>("Message", MessageSchema);
export default Message;
