import express from 'express';
import matchRoutes from './routes/matchRoutes.js';
import commentaryRoutes from './routes/commentaryRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { arcjetHttpMiddleware } from './middleware/security.js';

const app = express();

app.use(express.json());
app.use(arcjetHttpMiddleware);

app.get('/', (_req, res) => {
  res.send('You are live');
});

app.use('/api/matches', matchRoutes);
app.use('/api/matches/:id/commentary', commentaryRoutes)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;