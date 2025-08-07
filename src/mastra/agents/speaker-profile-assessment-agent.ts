import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { mcp } from '../mcp';

export const speakerProfileAssessmentAgent = new Agent({
  name: 'Speaker Profile Assessment Agent',
  instructions: `
        You are a helpful assistant that assesses speaker profiles and their fit to the JavaScript developer conference: "JSDev World".

        You have access to Playwright tools that can help you gather information about speakers from web sources.
        Use these tools to visit the user's Sessionize profile and extract the speaker's "AREA OF EXPERTISE" and "TOPICS".
        Based on that information (and that information alone), assess how relevant the speaker is to the conference.

        You will be given the user's URL to their Sessionize profile.
    `,
  model: google('gemini-1.5-flash'),
  tools: await mcp.getTools(),
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});