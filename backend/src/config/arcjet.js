import { env } from './env.js';
import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node';

// Validate ARCJET_MODE: accept only 'DRY_RUN' or 'LIVE'
// Default to 'LIVE' if unset/empty, but reject any other non-empty value
const ARCJET_MODE = (() => {
  if (!env.ARCJET_MODE) return 'LIVE'; // Default: unset or empty
  if (env.ARCJET_MODE === 'DRY_RUN') return 'DRY_RUN';
  if (env.ARCJET_MODE === 'LIVE') return 'LIVE';
  throw new Error(`Invalid ARCJET_MODE: "${env.ARCJET_MODE}". Must be "DRY_RUN" or "LIVE".`);
})();


export const httpArcjet = arcjet({
  key: env.ARCJET_KEY,
  rules: [
    shield({ mode: ARCJET_MODE }),
    detectBot({ mode: ARCJET_MODE, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'] }),
    slidingWindow({ mode: ARCJET_MODE, interval: '10s', max: 50 })
  ],
});

export const wsArcjet = arcjet({
  key: env.ARCJET_KEY,
  rules: [
    shield({ mode: ARCJET_MODE }),
    detectBot({ mode: ARCJET_MODE, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'] }),
    slidingWindow({ mode: ARCJET_MODE, interval: '2s', max: 5 })
  ],
});