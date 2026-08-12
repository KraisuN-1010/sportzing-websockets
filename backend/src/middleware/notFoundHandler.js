export const notFoundHandler = (_req, res) => {
  res.status(404).json({ error: 'Resource not found' });
};
