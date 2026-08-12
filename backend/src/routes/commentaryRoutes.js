import { Router } from 'express';
import { getCommentaries, createCommentary } from '../controllers/commentaryController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { matchIdParamSchema, listCommentaryQuerySchema, createCommentarySchema } from '../validation/commentary.js';

const commentaryRoutes = Router({ mergeParams: true });

commentaryRoutes.get(
  '/',
  validateRequest(matchIdParamSchema, 'params'),
  validateRequest(listCommentaryQuerySchema, 'query'),
  getCommentaries
);
commentaryRoutes.post(
  '/',
  validateRequest(matchIdParamSchema, 'params'),
  validateRequest(createCommentarySchema, 'body'),
  createCommentary
);

export default commentaryRoutes;