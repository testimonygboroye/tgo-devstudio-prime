import UserWhatsAppConnection from "@/models/UserWhatsAppConnection";

let migration: Promise<void> | null = null;

/**
 * Older deployments created a unique phoneNumberId index. A shared TGO
 * sender intentionally serves many opted-in recipients, so migrate that
 * index to the non-unique schema index before writing recipient rows.
 */
export async function ensureWhatsAppRecipientIndexes() {
  if (!migration) {
    migration = (async () => {
      const indexes = await UserWhatsAppConnection.collection.indexes().catch(() => []);
      const legacy = indexes.find((index) => index.name === "phoneNumberId_1" && index.unique === true);
      if (legacy) await UserWhatsAppConnection.collection.dropIndex("phoneNumberId_1");
      await UserWhatsAppConnection.collection.createIndex(
        { phoneNumberId: 1, personalPhoneNumber: 1, status: 1 },
        { name: "phoneNumberId_personalPhoneNumber_status" },
      );
    })().catch((error) => {
      migration = null;
      throw error;
    });
  }
  await migration;
}
