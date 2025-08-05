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
  overallQuality: z.object({
    score: z.number().min(1).max(5),
    justification: z.string()
  }),
  relevance: z.object({
    score: z.number().min(1).max(5),
    justification: z.string()
  }),
  technicalDepth: z.object({
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
    
    // Prepare the input for the agent
    const agentInput = {
      sessionId: sessionData.id,
      title: sessionData.title,
      description: sessionData.description,
      questionAnswers: sessionData.questionAnswers,
      categories: sessionData.categories,
      speakers: sessionData.speakers
    };

    // Get key takeaways from question answers
    const keyTakeawaysQuestion = sessionData.questionAnswers.find(qa => 
      qa.question.includes('key takeaways'));
    const keyTakeaways = keyTakeawaysQuestion?.answer || 'No key takeaways provided';

    const prompt = `Please evaluate this CFP session proposal:

Session ID: ${sessionData.id}
Title: ${sessionData.title}
Description: ${sessionData.description}
Key Takeaways: ${keyTakeaways}
Categories: ${sessionData.categories.map(c => c.name + ': ' + c.categoryItems.map(ci => ci.name).join(', ')).join('; ')}
Speakers: ${sessionData.speakers.map(s => s.name).join(', ')}

Please provide a structured evaluation with scores (1-5) and justifications for each criterion:

1. Title (1-5): How clear, engaging, and descriptive is the session title?
2. Description (1-5): How well does the description explain the session content, value, and target audience?
3. Key Takeaways (1-5): How valuable and actionable are the key takeaways provided?
4. Overall Quality (1-5): Overall assessment of the proposal's quality and completeness
5. Relevance (1-5): How relevant is this session to the conference theme and target audience?
6. Technical Depth (1-5): How technically sophisticated and in-depth is the proposed content?

Respond with a JSON object containing each criterion with a "score" (number 1-5) and "justification" (string) field.`;

    // For now, create a mock evaluation since we don't have API keys set up
    // In production, this would use the actual agent.generate() call
    const mockEvaluation = {
      title: { 
        score: Math.floor(Math.random() * 3) + 3, // 3-5
        justification: `Title "${sessionData.title}" is clear and descriptive for an React Native conference`
      },
      description: { 
        score: Math.floor(Math.random() * 3) + 3, // 3-5
        justification: `Description provides good technical depth and clear value proposition`
      },
      keyTakeaways: { 
        score: Math.floor(Math.random() * 3) + 3, // 3-5
        justification: `Key takeaways are actionable and relevant to the target audience`
      },
      overallQuality: { 
        score: Math.floor(Math.random() * 3) + 3, // 3-5
        justification: `Overall proposal quality is good with clear structure and content`
      },
      relevance: { 
        score: Math.floor(Math.random() * 3) + 3, // 3-5
        justification: `Session is highly relevant to React Native conference theme`
      },
      technicalDepth: { 
        score: Math.floor(Math.random() * 3) + 3, // 3-5
        justification: `Technical content shows appropriate depth for the target audience`
      }
    };

    // Uncomment the following code when API keys are available:
    /*
    const response = await agent.generate([
      {
        role: 'user',
        content: prompt
      }
    ]);

    // Parse the response to extract the structured evaluation
    // The agent should return a JSON object with the evaluation criteria
    let evaluationResult;
    try {
      evaluationResult = JSON.parse(response.text);
    } catch (error) {
      console.error('Failed to parse agent response as JSON:', response.text);
      // Return a default evaluation structure
      evaluationResult = {
        title: { score: 3, justification: 'Unable to parse response' },
        description: { score: 3, justification: 'Unable to parse response' },
        keyTakeaways: { score: 3, justification: 'Unable to parse response' },
        overallQuality: { score: 3, justification: 'Unable to parse response' },
        relevance: { score: 3, justification: 'Unable to parse response' },
        technicalDepth: { score: 3, justification: 'Unable to parse response' }
      };
    }
    */

    const evaluationResult = mockEvaluation;

    return evaluationResult;
  },
});

const cfpEvaluationWorkflow = createWorkflow({
  id: 'cfp-evaluation-workflow',
  inputSchema: sessionDataSchema,
  outputSchema: evaluationResultSchema,
})
  .then(evaluateSession);

cfpEvaluationWorkflow.commit();

export { cfpEvaluationWorkflow }; 