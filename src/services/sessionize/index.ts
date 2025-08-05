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

interface FetchSessionsResult {
  sessions: Session[];
  totalSessions: number;
  groups: {
    groupId: string | null;
    groupName: string;
    sessionCount: number;
  }[];
}

export class SessionizeService {
  private sessionsUrl: string;

  constructor(sessionsUrl: string) {
    this.sessionsUrl = sessionsUrl;
  }

  /**
   * Fetches all sessions from the Sessionize API
   * @returns Promise<FetchSessionsResult> - The sessions data with metadata
   * @throws Error if the request fails
   */
  async fetchSessions(): Promise<FetchSessionsResult> {
    try {
      const response = await fetch(this.sessionsUrl);
      
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
      throw new Error(`Failed to fetch sessions from ${this.sessionsUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets the URL being used for fetching sessions
   * @returns string - The sessions URL
   */
  getSessionsUrl(): string {
    return this.sessionsUrl;
  }

  /**
   * Updates the sessions URL
   * @param url - The new sessions URL
   */
  setSessionsUrl(url: string): void {
    this.sessionsUrl = url;
  }
}