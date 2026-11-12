import UserWhatsAppConnection from "@/models/UserWhatsAppConnection";

let migration: Promise<void> | null = null;

async function dropIfPresent(indexName: string) {
  try { await UserWhatsAppConnection.collection.dropIndex(indexName); }
  catch (error) {
    const detail = error as { code?: number; codeName?: string };
    if (detail.code !== 27 && detail.codeName !== "IndexNotFound") throw error;
  }
}

/**
 * Older deployments created a unique phoneNumberId index. A shared TGO
 * sender intentionally serves many opted-in recipients, so migrate that
 * index to the non-unique schema index before writing recipient rows.
 */
export async function ensureWhatsAppRecipientIndexes() {
  if (!migration) {
    migration = (async () => {
      const indexes = await UserWhatsAppConnection.collection.indexes().catch(() => []);
      const legacySenderIndex = indexes.find((index) => index.name === "phoneNumberId_1" && index.unique === true);
      if (legacySenderIndex) await dropIfPresent("phoneNumberId_1");
      const legacyRecipientIndex = indexes.find((index) => index.name === "personalPhoneNumber_1" && index.unique === true);
      if (legacyRecipientIndex) await dropIfPresent("personalPhoneNumber_1");
      await UserWhatsAppConnection.collection.createIndex(
        { phoneNumberId: 1, personalPhoneNumber: 1, status: 1 },
        { name: "phoneNumberId_personalPhoneNumber_status" },
      );
      await UserWhatsAppConnection.collection.createIndex(
        { personalPhoneNumber: 1 },
        { unique: true, partialFilterExpression: { status: "connected" }, name: "active_personal_phone_unique" },
      );
    })().catch((error) => {
      migration = null;
      throw error;
    });
  }
  await migration;
}
