import { Router } from 'express';
import { getAllMatches, createMatch } from '../controllers/matchController.js';

const matchRouter = Router();

matchRouter.get('/', getAllMatches);

matchRouter.post('/', createMatch);

export default matchRouter;