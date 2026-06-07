const mongoose = require('mongoose');

// Print minimal debug of the configured URI for troubleshooting (do not leak credentials)
if (process.env.MONGODB_URI) {
  try {
    const safe = process.env.MONGODB_URI.replace(/:[^@]+@/, ':<redacted>@');
    console.log('[DB] MONGODB_URI visible (redacted):', safe);
  } catch (_) {
    console.log('[DB] MONGODB_URI is set');
  }
} else {
  console.log('[DB] MONGODB_URI not set, using local fallback');
}

const DEFAULT_URI = 'mongodb://localhost:27017/ai-therapist';
const URI = process.env.MONGODB_URI || DEFAULT_URI;

const MAX_RETRIES = Number(process.env.MONGODB_CONNECT_MAX_RETRIES || 5);
const INITIAL_RETRY_DELAY_MS = Number(process.env.MONGODB_INITIAL_RETRY_DELAY_MS || 2000);

const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 45000),
  connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 10000),
};

let attempt = 0;
let backgroundInterval = null;

async function connectDB() {
  attempt++;
  try {
    console.log('[DB] Attempting to connect to MongoDB... Attempt', attempt);

    const conn = await mongoose.connect(URI, mongooseOptions);

    console.log('[DB] MongoDB Connected:', conn.connection.host);
    console.log('[DB] Database name:', conn.connection.name);
    console.log('[DB] Connection state:', conn.connection.readyState === 1 ? 'connected' : 'disconnected');

    if (backgroundInterval) {
      clearInterval(backgroundInterval);
      backgroundInterval = null;
    }

    return conn;
  } catch (error) {
    console.error('[DB] Connection error:', error && error.message);

    if (attempt <= MAX_RETRIES) {
      const delay = Math.min(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1), 30000);
      console.log(`[DB] Retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
      setTimeout(connectDB, delay);
    } else {
      console.error(`[DB] Failed to connect after ${MAX_RETRIES} attempts. Will continue background retries and will NOT crash the process.`);

      if (!backgroundInterval) {
        backgroundInterval = setInterval(() => {
          console.log('[DB] Background reconnect attempt...');
          mongoose.connect(URI, mongooseOptions)
            .then(() => {
              console.log('[DB] Background reconnect succeeded');
              if (backgroundInterval) {
                clearInterval(backgroundInterval);
                backgroundInterval = null;
              }
            })
            .catch((e) => {
              console.error('[DB] Background reconnect failed:', e && e.message);
            });
        }, Number(process.env.MONGODB_BACKGROUND_RETRY_MS || 60000));
      }
    }
  }
}

function logNonSrvTemplate() {
  if (URI && URI.startsWith('mongodb+srv://')) {
    console.warn('[DB] Using SRV URI. If Node DNS SRV lookups fail, use the Atlas Standard (non-SRV) connection string. Example:');
    console.warn('  mongodb://<username>:<password>@host1:27017,host2:27017,host3:27017/<dbname>?ssl=true&replicaSet=<replicaSetName>&authSource=admin&retryWrites=true&w=majority');
  }
}

mongoose.connection.on('error', (err) => console.error('[DB] Mongoose connection error', err && err.message));
mongoose.connection.on('disconnected', () => console.warn('[DB] Mongoose disconnected'));
mongoose.connection.on('reconnected', () => console.log('[DB] Mongoose reconnected'));

process.on('SIGINT', async () => {
  console.log('[DB] SIGINT received: closing mongoose connection');
  try {
    await mongoose.disconnect();
  } catch (e) {
    /* ignore */
  }
  process.exit(0);
});

logNonSrvTemplate();
connectDB();

module.exports = connectDB;
