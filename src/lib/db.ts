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

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Configure it in the hosting provider's environment settings."
    );
  }

  const readyState = mongoose.connection.readyState;

  if (readyState === 1) {
    cached.conn = mongoose;
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
  }).then(() => {
    cached.conn = mongoose;
    return mongoose;
  }).catch((error: unknown) => {
    cached.conn = null;
    cached.promise = null;
    throw error;
  });

  return cached.promise;
}
