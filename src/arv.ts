import FirecrawlApp from '@mendable/firecrawl-js';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel, systemPrompt } from './ai/providers';
import pLimit from 'p-limit';

// Initialize Firecrawl with API key from environment variables
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_KEY });

// Define the schema for detailed property data extraction
const detailedPropertySchema = {
  type: 'object',
  properties: {
    neighborhood: { type: 'string' },
    hasPool: { type: 'boolean' },
    lotSize: { type: 'number' },
    yearBuilt: { type: 'number' },
    condition: { type: 'string' },
  },
};

// Function to extract detailed property data from a URL
async function extractDetailedPropertyData(url: string) {
  try {
    const scrapeResult = await firecrawl.scrapeUrl(url, {
      jsonOptions: {
        schema: detailedPropertySchema,
        systemPrompt: "You are a real estate expert extracting property details.",
        prompt: "Extract the neighborhood, hasPool, lotSize, yearBuilt, and condition from the page.",
      },
    });

    // The structured data is in scrapeResult.llm_extraction
    return scrapeResult.llm_extraction || null;
  } catch (e) {
    console.error(`Error scraping ${url}:`, e);
    return null;
  }
}

// Function to compare a comp to the main property
async function compareProperties(mainProperty: any, comp: any) {
  const mainDetails = mainProperty.details;
  const compDetails = comp.details;

  // Comparison logic based on neighborhood, pool, etc.
  const similarityScore = calculateSimilarity(mainDetails, compDetails);
  return similarityScore > 0.7; // Threshold for viability
}

// Similarity calculation (customize as needed)
function calculateSimilarity(main: any, comp: any) {
  let score = 0;
  if (main.neighborhood === comp.neighborhood) score += 0.3;
  if (main.hasPool === comp.hasPool) score += 0.2;
  if (Math.abs(main.lotSize - comp.lotSize) < 1000) score += 0.2;
  if (Math.abs(main.yearBuilt - comp.yearBuilt) < 10) score += 0.2;
  if (main.condition === comp.condition) score += 0.1;
  return score;
}

// Function to validate comps
async function validateComps(mainProperty: any, comps: any[]) {
  const limit = pLimit(2); // Concurrency limit
  const validatedComps = await Promise.all(
    comps.map((comp) =>
      limit(async () => {
        const details = await extractDetailedPropertyData(comp.detailUrl);
        if (details) {
          comp.details = details;
          const isSimilar = await compareProperties(mainProperty, comp);
          return isSimilar ? comp : null;
        }
        return null;
      })
    )
  );
  return validatedComps.filter((comp) => comp !== null);
}

// Function to calculate ARV using AI analysis
async function calculateARV(mainProperty: any, validatedComps: any[]) {
  const compsString = validatedComps
    .map(
      (comp) => `
    - Address: ${comp.address}
    - Sale Price: $${comp.hdpData.homeInfo.price || 'N/A'}
    - Neighborhood: ${comp.details?.neighborhood || 'Unknown'}
    - Has Pool: ${comp.details?.hasPool ? 'Yes' : 'No'}
    - Lot Size: ${comp.details?.lotSize || 'Unknown'} sqft
    - Year Built: ${comp.details?.yearBuilt || 'Unknown'}
    - Condition: ${comp.details?.condition || 'Unknown'}
  `
    )
    .join('\n');

  const prompt = `
    Estimate the After Repair Value (ARV) for the following property based on the provided validated comparable sales (comps):

    Main Property:
    - Address: ${mainProperty.address}
    - Bedrooms: ${mainProperty.bedrooms}
    - Bathrooms: ${mainProperty.bathrooms}
    - Square Footage: ${mainProperty.squareFootage}
    - Neighborhood: ${mainProperty.details.neighborhood}
    - Has Pool: ${mainProperty.details.hasPool ? 'Yes' : 'No'}
    - Lot Size: ${mainProperty.details.lotSize} sqft
    - Year Built: ${mainProperty.details.yearBuilt}
    - Condition: ${mainProperty.details.condition}

    Validated Comps:
    ${compsString}

    Analyze the similarities and differences to provide a single estimated ARV value in dollars and a brief explanation.
  `;

  const res = await generateObject({
    model: getModel(),
    system: systemPrompt, // Treat systemPrompt as a string
    prompt,
    schema: z.object({
      arv: z.number(),
      explanation: z.string(),
    }),
  });

  return res.object;
}

// Main function to find ARV with provided comps
export async function findARV({
  mainProperty,
  comps,
}: {
  mainProperty: {
    address: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    details: any; // Pre-fetched or provided
  };
  comps: any[];
}) {
  // Validate the provided comps
  let validatedComps = await validateComps(mainProperty, comps);

  // If no comps are validated, use provided comps with default details
  if (validatedComps.length === 0) {
    console.warn('No validated comps found; proceeding with provided comps for ARV estimation');
    validatedComps = comps.map((comp) => ({
      ...comp,
      details: {
        neighborhood: 'Unknown',
        hasPool: false,
        lotSize: 0,
        yearBuilt: 0,
        condition: 'Unknown',
      },
    }));
  }

  // Calculate ARV
  const arvResult = await calculateARV(mainProperty, validatedComps);

  return {
    arv: arvResult.arv,
    explanation: arvResult.explanation,
    validatedComps,
  };
}
