import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Define the input schema for session data
const sessionDataSchema = z.object({
  sessionData: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    questionAnswers: z.array(z.object({
      question: z.string(),
      answer: z.string().nullable(),
      questionType: z.string()
    })),
    categories: z.array(z.object({
      name: z.string(),
      categoryItems: z.array(z.object({
        name: z.string()
      }))
    })),
    speakers: z.array(z.object({
      name: z.string()
    }))
  })
});

// Define the output schema for evaluation results
const evaluationResultSchema = z.object({
  title: z.object({
    score: z.number().min(1).max(5),
    justification: z.string()
  }),
  description: z.object({
    score: z.number().min(1).max(5),
    justification: z.string()
  }),
  keyTakeaways: z.object({
    score: z.number().min(1).max(5),
    justification: z.string()
  }),
  givenBefore: z.object({
    score: z.number().min(1).max(5),
    justification: z.string()
  })
});

const evaluateSession = createStep({
  id: 'evaluate-session',
  description: 'Evaluates a CFP session proposal using AI agent',
  inputSchema: sessionDataSchema,
  outputSchema: evaluationResultSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const agent = mastra?.getAgent('cfpEvaluationAgent');
    if (!agent) {
      throw new Error('CFP Evaluation agent not found');
    }

    const sessionData = inputData.sessionData;

    // Get key takeaways from question answers
    const keyTakeawaysQuestion = sessionData.questionAnswers.find(qa =>
      qa.question.includes('key takeaways'));
    const keyTakeaways = keyTakeawaysQuestion?.answer || 'No key takeaways provided';

    const prompt = `Please evaluate this CFP session proposal:

## Session Title

${sessionData.title}

## Session Description

${sessionData.description}

## Session Key Takeaways

${keyTakeaways}

## Session field: Have you given this talk before?

${sessionData.categories.find(c => c.name === "Have you given this talk before?")?.categoryItems.map(ci => ci.name).join(', ')}
`;

    // An example mock response from an agent if you don't yet have API keys set up.
    // In production, this would use the actual agent.generate() call
    // const mockEvaluation = {
    //   title: { 
    //     score: Math.floor(Math.random() * 3) + 3, // 3-5
    //     justification: `Title "${sessionData.title}" is clear and descriptive for the conference`
    //   },
    //   description: { 
    //     score: Math.floor(Math.random() * 3) + 3, // 3-5
    //     justification: `Description provides good technical depth and clear value proposition`
    //   },
    //   keyTakeaways: { 
    //     score: Math.floor(Math.random() * 3) + 3, // 3-5
    //     justification: `Key takeaways are actionable and relevant to the target audience`
    //   },
    //   givenBefore: { 
    //     score: Math.floor(Math.random() * 3) + 3, // 3-5
    //     justification: `Talk has been given before and the speaker did not note any improvements or evolutions to the talk.`
    //   }
    // };
    // const evaluationResult = mockEvaluation; // Using mock for now

    // Uncomment the following code when API keys are available:
    const response = await agent.generate([
      {
        role: 'user',
        content: prompt
      }
    ], {
      maxRetries: 0,
      output: evaluationResultSchema,
    });

    // Parse the response to extract the structured evaluation
    // The agent should return a JSON object with the evaluation criteria
    let evaluationResult;
    try {
      evaluationResult = response.object
    } catch (error) {
      console.error('Failed to parse agent response as JSON:', String(response.object));
      // Return a default evaluation structure
      evaluationResult = {
        title: { score: 3, justification: 'Unable to parse response' },
        description: { score: 3, justification: 'Unable to parse response' },
        keyTakeaways: { score: 3, justification: 'Unable to parse response' },
        givenBefore: { score: 3, justification: 'Unable to parse response' }
      };
    }

    return evaluationResult;
  },
});

// CFP Evaluation Workflow
const cfpEvaluationWorkflow = createWorkflow({
  id: 'cfp-evaluation-workflow',
  inputSchema: sessionDataSchema,
  outputSchema: evaluationResultSchema,
})
  .then(evaluateSession);

cfpEvaluationWorkflow.commit();

export { cfpEvaluationWorkflow }; 