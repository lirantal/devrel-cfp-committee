import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface QuestionAnswer {
  id: number;
  question: string;
  questionType: string;
  answer: string | null;
  sort: number;
  answerExtra: string | null;
}

interface Speaker {
  id: string;
  name: string;
}
 
interface CategoryItem {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  categoryItems: CategoryItem[];
  sort: number;
}

interface Session {
  questionAnswers: QuestionAnswer[];
  id: string;
  title: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
  isServiceSession: boolean;
  isPlenumSession: boolean;
  speakers: Speaker[];
  categories: Category[];
  roomId: string | null;
  room: string | null;
  liveUrl: string | null;
  recordingUrl: string | null;
  status: string;
  isInformed: boolean;
  isConfirmed: boolean;
}

interface SessionGroup {
  groupId: string | null;
  groupName: string;
  sessions: Session[];
}

interface SessionizeResponse extends Array<SessionGroup> {}

export const sessionizeSessionsTool = createTool({
  id: 'get-sessionize-sessions',
  description: 'Get sessions data from Sessionize API',
  inputSchema: z.object({
    url: z.string().optional().describe('Sessionize API endpoint URL').default('http://localhost:3001/sessions'),
  }),
  outputSchema: z.object({
    sessions: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      speakers: z.array(z.object({
        id: z.string(),
        name: z.string(),
      })),
      status: z.string(),
      categories: z.array(z.object({
        id: z.number(),
        name: z.string(),
        categoryItems: z.array(z.object({
          id: z.number(),
          name: z.string(),
        })),
        sort: z.number(),
      })),
      questionAnswers: z.array(z.object({
        id: z.number(),
        question: z.string(),
        questionType: z.string(),
        answer: z.string().nullable(),
        sort: z.number(),
        answerExtra: z.string().nullable(),
      })),
      startsAt: z.string().nullable(),
      endsAt: z.string().nullable(),
      isServiceSession: z.boolean(),
      isPlenumSession: z.boolean(),
      roomId: z.string().nullable(),
      room: z.string().nullable(),
      liveUrl: z.string().nullable(),
      recordingUrl: z.string().nullable(),
      isInformed: z.boolean(),
      isConfirmed: z.boolean(),
    })),
    totalSessions: z.number(),
    groups: z.array(z.object({
      groupId: z.string().nullable(),
      groupName: z.string(),
      sessionCount: z.number(),
    })),
  }),
  execute: async ({ context }) => {
    return await getSessionizeSessions(context.url);
  },
});

const getSessionizeSessions = async (url: string = 'http://localhost:3001/sessions') => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = (await response.json()) as SessionizeResponse;
    
    // Flatten all sessions from all groups
    const allSessions = data.flatMap(group => group.sessions);
    
    // Create groups summary
    const groups = data.map(group => ({
      groupId: group.groupId,
      groupName: group.groupName,
      sessionCount: group.sessions.length,
    }));
    
    return {
      sessions: allSessions,
      totalSessions: allSessions.length,
      groups,
    };
  } catch (error) {
    throw new Error(`Failed to fetch sessions from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 