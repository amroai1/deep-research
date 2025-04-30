import cors from 'cors';
import express, { Request, Response } from 'express';

import { runResearch } from './run'; // ✅ new function
// ❌ Remove deepResearch, writeFinalAnswer imports

const app = express();
const port = process.env.PORT || 3051;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint to run research
app.post('/api/research', async (req: Request, res: Response) => {
  try {
    const {
      query,
      depth = 3,
      breadth = 3,
      isReport = false,
      followUpAnswers = [],
    } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await runResearch({
      initialQuery: query,
      breadth,
      depth,
      isReport,
      followUpAnswers,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    console.error('Error in research API:', error);
    return res.status(500).json({
      error: 'An error occurred during research',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Deep Research API running on port ${port}`);
});

export default app;
