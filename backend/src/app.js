import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("You are live");
});

export default app;