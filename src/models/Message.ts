import { Schema, model, models, Document, Model, Types } from "mongoose";
import User from "@/models/User";
import Role from "@/models/Role";
import { sendAdminPush } from "@/lib/push/server";
import { getAdminBasePath } from "@/lib/adminPath";

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

MessageSchema.post("save", function (doc) {
  void (async () => {
    const recipient = await User.findById(doc.recipient).select("role").lean();
    if (!recipient) return;

    const role = await Role.findById(recipient.role).select("isFounderRole").lean();
    if (!role?.isFounderRole) return;

    await sendAdminPush({
      title: doc.title || "New admin message",
      body: doc.body || "You have a new message.",
      url: `${getAdminBasePath()}/messages`,
      category: "messages",
      tag: `message-${doc._id}`,
    }, String(recipient._id));
  })().catch((error) => console.error("[Push] Message notification failed:", error));
});

const Message: Model<IMessage> = models.Message || model<IMessage>("Message", MessageSchema);
export default Message;
