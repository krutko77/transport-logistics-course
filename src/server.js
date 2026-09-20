import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import resultsRouter from './routes/results.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));
app.use('/data', express.static(join(__dirname, 'data')));

app.use('/api/results', resultsRouter);

app.get('/api/debug-env', (req, res) => {
  res.json({
    MANAGER_EMAIL: Boolean(process.env.MANAGER_EMAIL),
    UNISENDER_GO_API_KEY: Boolean(process.env.UNISENDER_GO_API_KEY),
    UNISENDER_GO_USER_ID: Boolean(process.env.UNISENDER_GO_USER_ID),
    UNISENDER_GO_API_URL: Boolean(process.env.UNISENDER_GO_API_URL),
    UNISENDER_GO_FROM: Boolean(process.env.UNISENDER_GO_FROM),
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});

export default app;
