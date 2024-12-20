import mongoose from 'mongoose';

interface CachedConnection {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

// @ts-expect-error global is not typed
let cached: CachedConnection = global.mongoose;

if (!cached) {
  // @ts-expect-error global is not typed
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const MONGO_DB_URI =
    process.env.NODE_ENV === 'production'
      ? process.env.MONGO_DB_URI_PROD
      : process.env.MONGO_DB_URI_DEV;

  if (!MONGO_DB_URI) {
    throw new Error('MONGO_DB_URI environment variable is not defined');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGO_DB_URI, opts)
      .then((mongoose) => mongoose.connection)
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
