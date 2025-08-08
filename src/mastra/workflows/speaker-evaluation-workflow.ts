import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { DatabaseService, type SpeakerEvaluation } from '../../services/database';

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

const speakerEvaluationResultSchema = z.object({
  speakerId: z.string(),
  profileUrl: z.string(),
  evaluationResult: z.object({
    expertiseMatch: z.number().min(1).max(3),
    expertiseMatchJustification: z.string(),
    topicsRelevance: z.number().min(1).max(3),
    topicsRelevanceJustification: z.string()
  })
});

const fetchSpeakers = createStep({
  id: 'fetch-speakers',
  description: 'Fetches all speakers from the database',
  inputSchema: z.object({}), // No input needed
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

const evaluateSpeakerProfile = createStep({
  id: 'evaluate-speaker-profile',
  description: 'Evaluates a speaker profile using AI agent',
  inputSchema: speakerDataSchema,
  outputSchema: speakerEvaluationResultSchema,
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
      const sessionizeLinkObj = links.find(
        (link: any) =>
          (link.linkType && link.linkType.toLowerCase() === 'sessionize') ||
          (link.url && (link.url.includes('sessionize.com') || link.url.includes('sessionize.io')))
      );
      if (sessionizeLinkObj && sessionizeLinkObj.url) {
        sessionizeProfileUrl = sessionizeLinkObj.url;
      }
    } catch (error) {
      console.warn(`Could not parse links for speaker ${inputData.fullName}:`, error);
    }

    if (!sessionizeProfileUrl) {
      // Return default evaluation if no Sessionize profile found
      return {
        speakerId: inputData.id,
        profileUrl: '',
        evaluationResult: {
          expertiseMatch: 2,
          expertiseMatchJustification: 'Unable to assess - no Sessionize profile found',
          topicsRelevance: 2,
          topicsRelevanceJustification: 'Unable to assess - no Sessionize profile found'
        }
      };
    }

    const prompt = `Please assess this speaker's profile for the JavaScript developer conference "JSDev World".

Sessionize Profile URL: ${sessionizeProfileUrl}
`;

    try {
      const response = await agent.generate([
        {
          role: 'user',
          content: prompt
        }
      ], {
        maxRetries: 0,
        output: z.object({
          expertiseMatch: z.number().min(1).max(3),
          expertiseMatchJustification: z.string(),
          topicsRelevance: z.number().min(1).max(3),
          topicsRelevanceJustification: z.string()
        }),
      });

      return {
        speakerId: inputData.id,
        profileUrl: sessionizeProfileUrl,
        evaluationResult: response.object
      };
    } catch (error) {
      console.error(`Failed to assess speaker ${inputData.fullName}:`, error);
      // Return default evaluation on error
      return {
        speakerId: inputData.id,
        profileUrl: '',
        evaluationResult: {
          expertiseMatch: 2,
          expertiseMatchJustification: 'Unable to assess - no Sessionize profile found',
          topicsRelevance: 2,
          topicsRelevanceJustification: 'Unable to assess - no Sessionize profile found'
        }
      };
    }
  },
});

const evaluateAndSaveSpeakerProfile = createStep({
  id: 'evaluate-and-save-speaker-profile',
  description: 'Evaluates a speaker profile and saves results to database',
  inputSchema: speakerDataSchema,
  outputSchema: speakerEvaluationResultSchema,
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
      const sessionizeLinkObj = links.find(
        (link: any) =>
          (link.linkType && link.linkType.toLowerCase() === 'sessionize') ||
          (link.url && (link.url.includes('sessionize.com') || link.url.includes('sessionize.io')))
      );
      if (sessionizeLinkObj && sessionizeLinkObj.url) {
        sessionizeProfileUrl = sessionizeLinkObj.url;
      }
    } catch (error) {
      console.warn(`Could not parse links for speaker ${inputData.fullName}:`, error);
    }

    let evaluationResult;
    if (!sessionizeProfileUrl) {
      // Return default evaluation if no Sessionize profile found
      evaluationResult = {
        expertiseMatch: 2,
        expertiseMatchJustification: 'Unable to assess - no Sessionize profile found',
        topicsRelevance: 2,
        topicsRelevanceJustification: 'Unable to assess - no Sessionize profile found'
      };
    } else {
      const prompt = `Please assess this speaker's profile for the JavaScript developer conference "JSDev World".

Sessionize Profile URL: ${sessionizeProfileUrl}
`;

      try {
        const response = await agent.generate([
          {
            role: 'user',
            content: prompt
          }
        ], {
          maxRetries: 0,
          output: z.object({
            expertiseMatch: z.number().min(1).max(3),
            expertiseMatchJustification: z.string(),
            topicsRelevance: z.number().min(1).max(3),
            topicsRelevanceJustification: z.string()
          }),
        });

        evaluationResult = response.object;
      } catch (error) {
        console.error(`Failed to assess speaker ${inputData.fullName}:`, error);
        // Return default evaluation on error
        evaluationResult = {
          expertiseMatch: 2,
          expertiseMatchJustification: 'Unable to assess - no Sessionize profile found',
          topicsRelevance: 2,
          topicsRelevanceJustification: 'Unable to assess - no Sessionize profile found'
        };
      }
    }

    // Save the evaluation to database
    const dbService = new DatabaseService();
    await dbService.initialize();

    try {
      // Convert the evaluation result to the SpeakerEvaluation format
      const evaluation: SpeakerEvaluation = {
        expertiseMatch: {
          score: evaluationResult.expertiseMatch,
          justification: evaluationResult.expertiseMatchJustification
        },
        topicsRelevance: {
          score: evaluationResult.topicsRelevance,
          justification: evaluationResult.topicsRelevanceJustification
        }
      };

      await dbService.saveSpeakerEvaluation(
        inputData.id,
        sessionizeProfileUrl,
        evaluation
      );

      console.log(`✅ Saved evaluation for speaker ${inputData.id}`);
      
      return {
        speakerId: inputData.id,
        profileUrl: sessionizeProfileUrl,
        evaluationResult
      };
    } finally {
      await dbService.close();
    }
  },
});

// Speaker Evaluation Workflow
const speakerEvaluationWorkflow = createWorkflow({
  id: 'speaker-evaluation-workflow',
  inputSchema: z.object({}), // No input needed - fetches all speakers
  outputSchema: z.array(speakerEvaluationResultSchema),
})
  .then(fetchSpeakers)
  .then(extractSpeakersArray)
  .foreach(evaluateAndSaveSpeakerProfile, { concurrency: 2 });

speakerEvaluationWorkflow.commit();

export { speakerEvaluationWorkflow };
