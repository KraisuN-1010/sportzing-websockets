import express from 'express';
import matchRoutes from './routes/matchRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('You are live');
});

app.use('/api', matchRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;