import cors from 'cors';
import express, { Request, Response } from 'express';

import { runResearch } from './run';
import { findARV } from './arv'; // Import findARV from arv.ts

const app = express();
const port = process.env.PORT || 3051;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint to run research (unchanged)
app.post('/api/research', async (req: Request, res: Response) => {
  try {
    const {
      query,
      depth = 1,
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

// New API endpoint for ARV calculation
app.post('/api/arv', async (req: Request, res: Response) => {
  try {
    const { mainProperty, comps } = req.body;

    // Validate mainProperty
    if (!mainProperty || typeof mainProperty !== 'object') {
      return res.status(400).json({ error: 'mainProperty is required and must be an object' });
    }
    const { address, bedrooms, bathrooms, squareFootage, details } = mainProperty;
    if (typeof address !== 'string' || address.trim() === '') {
      return res.status(400).json({ error: 'Invalid mainProperty address' });
    }
    if (typeof bedrooms !== 'number' || bedrooms < 0) {
      return res.status(400).json({ error: 'Invalid mainProperty bedrooms' });
    }
    if (typeof bathrooms !== 'number' || bathrooms < 0) {
      return res.status(400).json({ error: 'Invalid mainProperty bathrooms' });
    }
    if (typeof squareFootage !== 'number' || squareFootage <= 0) {
      return res.status(400).json({ error: 'Invalid mainProperty square footage' });
    }
    if (!details || typeof details !== 'object') {
      return res.status(400).json({ error: 'mainProperty details are required and must be an object' });
    }
    const { neighborhood, hasPool, lotSize, yearBuilt, condition } = details;
    if (typeof neighborhood !== 'string' || neighborhood.trim() === '') {
      return res.status(400).json({ error: 'Invalid mainProperty details.neighborhood' });
    }
    if (typeof hasPool !== 'boolean') {
      return res.status(400).json({ error: 'Invalid mainProperty details.hasPool' });
    }
    if (typeof lotSize !== 'number' || lotSize <= 0) {
      return res.status(400).json({ error: 'Invalid mainProperty details.lotSize' });
    }
    if (typeof yearBuilt !== 'number' || yearBuilt <= 0) {
      return res.status(400).json({ error: 'Invalid mainProperty details.yearBuilt' });
    }
    if (typeof condition !== 'string' || condition.trim() === '') {
      return res.status(400).json({ error: 'Invalid mainProperty details.condition' });
    }

    // Validate comps
    if (!comps || !Array.isArray(comps) || comps.length === 0) {
      return res.status(400).json({ error: 'comps is required and must be a non-empty array' });
    }
    for (const comp of comps) {
      if (!comp || typeof comp !== 'object') {
        return res.status(400).json({ error: 'Each comp must be an object' });
      }
      const { address, detailUrl, hdpData } = comp;
      if (typeof address !== 'string' || address.trim() === '') {
        return res.status(400).json({ error: 'Invalid comp address' });
      }
      if (typeof detailUrl !== 'string' || !detailUrl.startsWith('http')) {
        return res.status(400).json({ error: 'Invalid comp detailUrl' });
      }
      if (!hdpData || typeof hdpData !== 'object' || !hdpData.homeInfo) {
        return res.status(400).json({ error: 'Invalid comp hdpData' });
      }
      const { price } = hdpData.homeInfo;
      if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: 'Invalid comp hdpData.homeInfo.price' });
      }
    }

    // Call findARV
    const result = await findARV({
      mainProperty,
      comps,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    console.error('Error in ARV API:', error);
    return res.status(500).json({
      error: 'An error occurred during ARV calculation',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Deep Research API running on port ${port}`);
});

export default app;
