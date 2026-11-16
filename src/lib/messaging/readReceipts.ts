export type ReadReceiptMember = { _id: string; name: string };

export function getReadReceiptSummary(
  readBy: readonly string[] | undefined,
  senderId: string | undefined,
  currentUserId: string,
  members: readonly ReadReceiptMember[],
  conversationKind: string,
): { label: string; title: string } | null {
  const sender = String(senderId || "");
  if (!sender || sender !== currentUserId) return null;
  const readerIds = [...new Set((readBy || []).map(String).filter((id) => id && id !== sender))];
  if (!readerIds.length) return null;
  const totalRecipients = Math.max(members.length - 1, 1);
  const names = readerIds.map((id) => members.find((member) => member._id === id)?.name || "Team member");
  return {
    label: conversationKind === "direct" ? "Seen" : `Seen by ${readerIds.length}/${totalRecipients}`,
    title: names.join(", "),
  };
}
