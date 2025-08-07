import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { DatabaseService } from '../../services/database';

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

// Define schemas for speaker assessment
const speakerDataSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  bio: z.string(),
  tagLine: z.string(),
  profilePicture: z.string(),
  isTopSpeaker: z.boolean(),
  sessions: z.string(), // JSON stringified array
  links: z.string(), // JSON stringified array
  questionAnswers: z.string(), // JSON stringified array
  categories: z.string(), // JSON stringified array
  createdAt: z.string()
});

const speakerAssessmentResultSchema = z.object({
  speakerId: z.string(),
  speakerName: z.string(),
  assessment: z.object({
    relevanceScore: z.number().min(1).max(5),
    expertiseMatch: z.string(),
    topicsRelevance: z.string(),
    overallAssessment: z.string()
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

const fetchSpeakers = createStep({
  id: 'fetch-speakers',
  description: 'Fetches all speakers from the database',
  inputSchema: evaluationResultSchema, // Expect the evaluation result as input
  outputSchema: z.object({
    speakers: z.array(speakerDataSchema)
  }),
  execute: async ({ mastra }) => {
    const dbService = new DatabaseService();
    await dbService.initialize();
    
    try {
      const speakers = await dbService.getAllSpeakers();
      console.log(`📋 Fetched ${speakers.length} speakers from database`);
      
      return {
        speakers: speakers.map(speaker => ({
          id: speaker.id,
          firstName: speaker.first_name,
          lastName: speaker.last_name,
          fullName: speaker.full_name,
          bio: speaker.bio,
          tagLine: speaker.tag_line,
          profilePicture: speaker.profile_picture,
          isTopSpeaker: speaker.is_top_speaker,
          sessions: speaker.sessions,
          links: speaker.links,
          questionAnswers: speaker.question_answers,
          categories: speaker.categories,
          createdAt: speaker.created_at
        }))
      };
    } finally {
      await dbService.close();
    }
  },
});

const extractSpeakersArray = createStep({
  id: 'extract-speakers-array',
  description: 'Extracts the speakers array for foreach processing',
  inputSchema: z.object({
    speakers: z.array(speakerDataSchema)
  }),
  outputSchema: z.array(speakerDataSchema),
  execute: async ({ inputData }) => {
    return inputData.speakers;
  },
});

const assessSpeakerProfile = createStep({
  id: 'assess-speaker-profile',
  description: 'Assesses a speaker profile using AI agent',
  inputSchema: speakerDataSchema,
  outputSchema: speakerAssessmentResultSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Speaker data not found');
    }

    const agent = mastra?.getAgent('speakerProfileAssessmentAgent');
    if (!agent) {
      throw new Error('Speaker Profile Assessment agent not found');
    }

    // Parse the links to find Sessionize profile URL
    let sessionizeProfileUrl = '';
    try {
      const links = JSON.parse(inputData.links);
      const sessionizeLink = links.find((link: string) => 
        link.includes('sessionize.com') || link.includes('sessionize.io'));
      if (sessionizeLink) {
        sessionizeProfileUrl = sessionizeLink;
      }
    } catch (error) {
      console.warn(`Could not parse links for speaker ${inputData.fullName}:`, error);
    }

    if (!sessionizeProfileUrl) {
      // Return default assessment if no Sessionize profile found
      return {
        speakerId: inputData.id,
        speakerName: inputData.fullName,
        assessment: {
          relevanceScore: 3,
          expertiseMatch: 'Unable to assess - no Sessionize profile found',
          topicsRelevance: 'Unable to assess - no Sessionize profile found',
          overallAssessment: 'No Sessionize profile URL available for assessment'
        }
      };
    }

    const prompt = `Please assess this speaker's profile for the JavaScript developer conference "JSDev World".

Speaker Name: ${inputData.fullName}
Bio: ${inputData.bio}
Tag Line: ${inputData.tagLine}
Sessionize Profile URL: ${sessionizeProfileUrl}

Please visit the Sessionize profile and assess the speaker's relevance to our JavaScript developer conference. Focus on:
1. Area of expertise match with JavaScript/Web development
2. Topics they typically speak about
3. Overall relevance to our conference audience

Provide a structured assessment with scores and justifications.`;

    try {
      const response = await agent.generate([
        {
          role: 'user',
          content: prompt
        }
      ], {
        maxRetries: 0,
        output: z.object({
          relevanceScore: z.number().min(1).max(5),
          expertiseMatch: z.string(),
          topicsRelevance: z.string(),
          overallAssessment: z.string()
        }),
      });

      return {
        speakerId: inputData.id,
        speakerName: inputData.fullName,
        assessment: response.object
      };
    } catch (error) {
      console.error(`Failed to assess speaker ${inputData.fullName}:`, error);
      // Return default assessment on error
      return {
        speakerId: inputData.id,
        speakerName: inputData.fullName,
        assessment: {
          relevanceScore: 3,
          expertiseMatch: 'Assessment failed - using default score',
          topicsRelevance: 'Assessment failed - using default score',
          overallAssessment: 'Unable to complete assessment due to error'
        }
      };
    }
  },
});

const cfpEvaluationWorkflow = createWorkflow({
  id: 'cfp-evaluation-workflow',
  inputSchema: sessionDataSchema,
  outputSchema: z.object({
    sessionEvaluation: evaluationResultSchema,
    speakerAssessments: z.array(speakerAssessmentResultSchema)
  }),
})
  .then(evaluateSession)
  .then(fetchSpeakers)
  .then(extractSpeakersArray)
  .foreach(assessSpeakerProfile, { concurrency: 2 })
  .map({
    sessionEvaluation: {
      step: evaluateSession,
      path: "output"
    },
    speakerAssessments: {
      step: assessSpeakerProfile,
      path: "output"
    }
  });

cfpEvaluationWorkflow.commit();

export { cfpEvaluationWorkflow }; 