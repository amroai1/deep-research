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
    const followUpQuestions = await generateFeedback({ query: initialQuery });

    // For now, skip asking for answers; assume default or empty input.
    combinedQuery = `
Initial Query: ${initialQuery}
Follow-up Questions and Answers:
${followUpQuestions.map((q, i) => `Q: ${q}\nA: ${followUpAnswers[i] || ''}`).join('\n')}
`;
  }

  const { learnings, visitedUrls } = await deepResearch({
    query: combinedQuery,
    breadth,
    depth,
  });

  if (isReport) {
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
