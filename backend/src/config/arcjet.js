import { env } from './env.js';
import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node';

const ARCJET_KEY = env.ARCJET_KEY;
const ARCJET_MODE = env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

if (!ARCJET_KEY) throw new Error("ARCJET_KEY environment variable is not set.");

export const httpArcjet = arcjet({
  key: ARCJET_KEY,
  rules: [
    shield({ mode: ARCJET_MODE }),
    detectBot({ mode: ARCJET_MODE, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'] }),
    slidingWindow({ mode: ARCJET_MODE, interval: '10s', max: 50 })
  ],
});

export const wsArcjet = arcjet({
  key: ARCJET_KEY,
  rules: [
    shield({ mode: ARCJET_MODE }),
    detectBot({ mode: ARCJET_MODE, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'] }),
    slidingWindow({ mode: ARCJET_MODE, interval: '2s', max: 5 })
  ],
});