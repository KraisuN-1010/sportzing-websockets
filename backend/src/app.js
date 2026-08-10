import express from "express";
import matchRoutes from "./routes/matchRoutes.js"
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("You are live");
});

app.use("/api", matchRoutes);

export default app;