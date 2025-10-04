import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "spidey-sense-backend", time: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.type('text/plain').send('Spidey-Sense backend is running. Try GET /health.');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
