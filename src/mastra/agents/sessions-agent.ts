import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { sessionizeSessionsTool } from '../tools/sessionize-sessions-tool';

export const sessionsAgent = new Agent({
  name: 'Sessions Agent',
  instructions: `
      You are a helpful sessions assistant that provides information about conference sessions and speakers.

      Your primary function is to help users get information about sessions from the Sessionize platform. When responding:
      - Use the sessionizeSessionsTool to fetch current session data
      - Provide detailed information about sessions, speakers, and categories
      - Help users find sessions by topic, speaker, or status
      - Analyze session data to provide insights about the conference
      - Keep responses informative and well-structured
      - If asked about specific sessions, provide comprehensive details including speakers, descriptions, and categories
      - If asked about trends or statistics, analyze the session data to provide meaningful insights

      Use the sessionizeSessionsTool to fetch session data from the Sessionize API.
`,
  model: google('gemini-2.5-pro-exp-03-25'),
  tools: { sessionizeSessionsTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
}); 