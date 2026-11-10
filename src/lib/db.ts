import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

let identityIndexMigration: Promise<void> | null = null;

async function ensureIdentityIndexes(): Promise<void> {
  if (!identityIndexMigration) {
    identityIndexMigration = (async () => {
      const database = mongoose.connection.db;
      if (!database) throw new Error("MongoDB is connected without an accessible database handle.");
      const users = database.collection("users");
      // Create scoped indexes before removing legacy global unique indexes.
      await users.createIndex({ email: 1, accountType: 1 }, { unique: true, name: "email_account_type_unique" });
      await users.createIndex(
        { googleSub: 1, accountType: 1 },
        { unique: true, partialFilterExpression: { googleSub: { $type: "string" } }, name: "google_sub_account_type_unique" },
      );
      const indexes = await users.listIndexes().toArray();
      for (const index of indexes) {
        const keys = index.key as Record<string, number> | undefined;
        if (!index.unique || !keys || Object.keys(keys).length !== 1) continue;
        if (keys.email === 1 || keys.googleSub === 1) await users.dropIndex(String(index.name));
      }
    })().catch((error: unknown) => {
      identityIndexMigration = null;
      throw error;
    });
  }
  await identityIndexMigration;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Configure it in the hosting provider's environment settings."
    );
  }

  const readyState = mongoose.connection.readyState;

  if (readyState === 1) {
    cached.conn = mongoose;
    await ensureIdentityIndexes();
    return mongoose;
  }

  // Reuse an in-flight connection attempt, but never retain a rejected or
  // disconnected promise forever. A later request must be able to recover
  // after a transient Atlas/network interruption.
  if (readyState === 2 && cached.promise) {
    return cached.promise;
  }

  cached.conn = null;
  cached.promise = null;

  cached.promise = mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 0,
    maxIdleTimeMS: 60000,
  }).then(async () => {
    cached.conn = mongoose;
    await ensureIdentityIndexes();
    return mongoose;
  }).catch((error: unknown) => {
    cached.conn = null;
    cached.promise = null;
    throw error;
  });

  return cached.promise;
}
