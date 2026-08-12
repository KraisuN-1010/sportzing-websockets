import { db } from '../config/db.js';
import { matches } from '../db/schema.js';
import { getMatchStatus } from '../utils/matchStatus.js';
import { ApiError } from '../utils/apiError.js';

const MAX_LIMIT = 100;

export const listMatches = async ({ limit }) => {
  const effectiveLimit = Math.min(limit ?? 50, MAX_LIMIT);
  return db
    .select()
    .from(matches)
    .orderBy(matches.createdAt)
    .limit(effectiveLimit);
};

export const createMatch = async (input) => {
  const { startTime, endTime, homeScore = 0, awayScore = 0, ...rest } = input;
  const parsedStartTime = new Date(startTime);
  const parsedEndTime = new Date(endTime);

  if (Number.isNaN(parsedStartTime.getTime()) || Number.isNaN(parsedEndTime.getTime())) {
    throw new ApiError(400, 'Invalid startTime or endTime');
  }

  const status = getMatchStatus(parsedStartTime, parsedEndTime);
  if (!status) {
    throw new ApiError(400, 'Unable to compute match status from provided times');
  }

  const [createdMatch] = await db
    .insert(matches)
    .values({
      ...rest,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      homeScore,
      awayScore,
      status,
    })
    .returning();

  if (!createdMatch) {
    throw new ApiError(500, 'Match creation failed');
  }

  return createdMatch;
};