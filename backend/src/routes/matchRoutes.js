import { Router } from 'express';
import { getAllMatches, createMatchController } from '../controllers/matchController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authMiddleware } from '../middleware/auth.js';
import { listMatchesQuerySchema, createMatchSchema } from '../validation/matches.js';

const matchRouter = Router();

matchRouter.get('/', validateRequest(listMatchesQuerySchema, 'query'), getAllMatches);
matchRouter.post('/', authMiddleware, validateRequest(createMatchSchema), createMatchController);

export default matchRouter;
