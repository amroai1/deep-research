import * as fs from 'fs/promises';     // only needed if you still write to disk
import { getModel } from './ai/providers';
import { generateFeedback } from './feedback';
import {
  deepResearch,
  writeFinalAnswer,
  writeFinalReport,
} from './deep-research';

export async function runResearch({
  initialQuery,
  followUpAnswers = [],
  isReport = true,
  breadth = 4,
  depth = 2,
}: {
  initialQuery: string;
  followUpAnswers?: string[];
  isReport?: boolean;
  breadth?: number;
  depth?: number;
}) {
  console.log('Using model: ', getModel().modelId);

  let combinedQuery = initialQuery;

  if (isReport && followUpAnswers.length === 0) {
    // Generate follow-up questions if no answers provided
    const followUpQuestions = await generateFeedback({ query: initialQuery });

    combinedQuery = `
Initial Query: ${initialQuery}
Follow-up Questions and Answers:
${followUpQuestions
  .map((q, i) => `Q: ${q}\nA: ${followUpAnswers[i] || ''}`)
  .join('\n')}
`;
  }

  // Perform the core deep research
  const { learnings, visitedUrls } = await deepResearch({
    query: combinedQuery,
    breadth,
    depth,
  });

  if (isReport) {
    // Generate and return a full report
    const report = await writeFinalReport({
      prompt: combinedQuery,
      learnings,
      visitedUrls,
    });

    return {
      type: 'report',
      content: report,
      urls: visitedUrls,
    };
  } else {
    // Generate and return a concise answer
    const answer = await writeFinalAnswer({
      prompt: combinedQuery,
      learnings,
    });

    return {
      type: 'answer',
      content: answer,
      urls: visitedUrls,
    };
  }
}
