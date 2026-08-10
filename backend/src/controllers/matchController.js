import { createMatchSchema, listMatchesQuerySchema } from '../validation/matches.js';
import { matches } from '../db/schema.js';
import { db } from '../config/db.js';
import { getMatchStatus } from '../utils/matchStatus.js';

const MAX_LIMIT = 100;

export const getAllMatches = async (req, res) => {
  try {
    const parsedData = listMatchesQuerySchema.safeParse(req.query);

    if (!parsedData.success) {
      return res.status(400).json({
        error: "Invalid query.",
        details: JSON.stringify(parsedData.error)
      });
    }

    const limit = Math.min(parsedData.data.limit ?? 50, MAX_LIMIT);
    const allMatches = await db
      .select()
      .from(matches)
      .orderBy(matches.createdAt)
      .limit(limit)

    res.status(200).json(allMatches);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching matches' });
  }
};

export const createMatch = async (req, res) => {
  try {
    const validatedData = createMatchSchema.parse(req.body);
    const { startTime, endTime, homeScore, awayScore } = validatedData;
    try {
      const newMatch = await db.insert(matches).values({
        ...validatedData,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      }).returning();

      res.status(201).json(newMatch);
    } catch (error) {
      console.error('Error creating match:', error);
      res.status(500).json({ error: 'An error occurred while creating the match' });
    }
    res.status(201).json(newMatch);
  } catch (error) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Error creating match:', error);
      res.status(500).json({ error: 'An error occurred while creating the match' });
    }
  }
};