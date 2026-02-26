import express from 'express';
import cors from 'cors';
import identifyRoute from './routes/identityRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Use the external router
app.use('/', identifyRoute);

app.get('/', (req, res) => {
  res.send('Server is running. Use POST /identify');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});