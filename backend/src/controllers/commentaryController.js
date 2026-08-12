import { desc, eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { commentary } from '../db/schema.js';

const MAX_LIMIT = 100;

export const getCommentaries = async (req, res, next) => {
  try {
    const matchId = req.params.id;
    const limit = Math.min(req.validatedQuery.limit ?? MAX_LIMIT, MAX_LIMIT);

    // Fetch commentaries for the specified match, ordered by createdAt descending
    const commentaries = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.status(200).json(commentaries);
  } catch (error) {
    next(error);
  }
};

export const createCommentary = async (req, res, next) => {
  try {
    const matchId = req.params.id;
    const commentaryData = req.body;

    // Insert commentary into the database using Drizzle ORM
    const [newCommentary] = await db
      .insert(commentary)
      .values({
        matchId,
        minute: commentaryData.minute,
        sequence: commentaryData.sequence,
        period: commentaryData.period,
        eventType: commentaryData.eventType,
        actor: commentaryData.actor,
        team: commentaryData.team,
        message: commentaryData.message,
        metadata: commentaryData.metadata,
        tags: commentaryData.tags,
      })
      .returning();

    if (res.app.locals.broadcastCommentaryToMatch) {
      res.app.locals.broadcastCommentaryToMatch(newCommentary.matchId, newCommentary);
    }
    res.status(201).json(newCommentary);
  } catch (error) {
    next(error);
  }
};