import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

/**
 * Loads environment variables from local files when present, while always allowing
 * real platform environment variables to win. This keeps local development and
 * Vercel production configuration working with the same backend code.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverEnvPath = path.resolve(__dirname, '..', '..', '.env');
const rootEnvPath = path.resolve(__dirname, '..', '..', '..', '.env');

const serverResult = dotenv.config({ path: serverEnvPath, quiet: true });
const rootResult = dotenv.config({ path: rootEnvPath, quiet: true });
dotenv.config({ quiet: true }); // current working directory fallback

const mask = (name, minLen = 1) => {
  const v = process.env[name];
  return `${name}=${v && v.length >= minLen ? 'set' : 'MISSING'}`;
};

const envStatus = [
  `server/.env ${fs.existsSync(serverEnvPath) && !serverResult.error ? 'loaded' : 'NOT FOUND'} (${serverEnvPath})`,
  `root/.env ${fs.existsSync(rootEnvPath) && !rootResult.error ? 'loaded' : 'NOT FOUND'} (${rootEnvPath})`,
].join(' | ');

console.log(`[Env] ${envStatus}`);
console.log(
  '[Env] ' +
    [
      mask('DATABASE_HOST'),
      mask('FIREBASE_ADMIN_PRIVATE_KEY'),
      mask('GEMINI_API_KEY'),
      mask('VITE_API_BASE_URL'),
    ].join(' | ')
);
