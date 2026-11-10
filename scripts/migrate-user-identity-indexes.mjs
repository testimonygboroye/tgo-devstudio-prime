import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required. Load the production database URI from your hosting environment; never paste it into chat.");
  process.exit(1);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const users = mongoose.connection.db.collection("users");
  const duplicates = await users.aggregate([
    { $group: { _id: { email: "$email", accountType: { $ifNull: ["$accountType", "staff"] } }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 10 }
  ]).toArray();
  if (duplicates.length) {
    throw new Error("Duplicate email/account-type pairs exist. No indexes were changed; resolve these records first.");
  }

  const indexes = await users.listIndexes().toArray();
  for (const index of indexes) {
    const keys = Object.keys(index.key || {});
    const isLegacyEmailUnique = index.unique === true && keys.length === 1 && keys[0] === "email";
    const isLegacyGoogleUnique = index.unique === true && keys.length === 1 && keys[0] === "googleSub";
    if ((isLegacyEmailUnique || isLegacyGoogleUnique) && index.name) {
      await users.dropIndex(index.name);
      console.log("Removed legacy uniqueness index:", index.name);
    }
  }

  await users.createIndex({ email: 1, accountType: 1 }, { unique: true, name: "email_account_type_unique" });
  await users.createIndex(
    { googleSub: 1, accountType: 1 },
    { unique: true, partialFilterExpression: { googleSub: { $type: "string" } }, name: "google_sub_account_type_unique" }
  );
  console.log("Identity index migration completed. Staff and client identities may now share an email address.");
} catch (error) {
  console.error("Identity index migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
