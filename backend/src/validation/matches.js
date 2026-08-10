import { z } from 'zod';

export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

const isoDateString = z.string().datetime({
  offset: true,
  message: 'Invalid ISO date string',
});

export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createMatchSchema = z.object({
  sport: z.string().min(1, 'Sport is required'),
  homeTeam: z.string().min(1, 'Home team is required'),
  awayTeam: z.string().min(1, 'Away team is required'),
  startTime: isoDateString,
  endTime: isoDateString,
  homeScore: z.coerce.number().int().min(0).optional(),
  awayScore: z.coerce.number().int().min(0).optional(),
}).superRefine((data, ctx) => {
  const start = Date.parse(data.startTime);
  const end = Date.parse(data.endTime);

  if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'endTime must be after startTime',
      path: ['endTime'],
    });
  }
});

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});
