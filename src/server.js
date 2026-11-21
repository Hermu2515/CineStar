import 'dotenv/config';
import pg from 'pg';
import { createApp } from './app.js';

const { Pool } = pg;

const port = Number(process.env.PORT ?? 3000);
const jwtSecret = process.env.JWT_SECRET;

if (!process.env.DATABASE_URL) {
  throw new Error('La variable de entorno DATABASE_URL es obligatoria.');
}

if (!jwtSecret) {
  throw new Error('La variable de entorno JWT_SECRET es obligatoria.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = createApp(pool, jwtSecret);

app.listen(port, () => {
  console.log(`Servidor CineStar ejecutándose en http://localhost:${port}`);
});