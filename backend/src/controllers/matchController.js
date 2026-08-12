import { listMatches, createMatch } from '../services/matchService.js';

// controllers/matchController.js
export const getAllMatches = async (req, res, next) => {
  try {
    const matches = await listMatches(req.validatedQuery); 
    res.status(200).json(matches);
  } catch (error) {
    next(error);
  }
};

export const createMatchController = async (req, res, next) => {
  try {
    const createdMatch = await createMatch(req.body);

    if (res.app.locals.broadcastMatchCreated) {
      res.app.locals.broadcastMatchCreated(createdMatch);
    }
    res.status(201).json(createdMatch);
  } catch (error) {
    next(error);
  }
};
