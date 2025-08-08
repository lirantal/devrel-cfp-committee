import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';
import { uuidv7 } from 'uuidv7';

// Types for our session data
interface SessionData {
  id: string;
  title: string;
  description: string;
  questionAnswers: Array<{
    question: string;
    answer: string | null;
    questionType: string;
  }>;
  categories: Array<{
    name: string;
    categoryItems: Array<{
      name: string;
    }>;
  }>;
  speakers: Array<{
    name: string;
  }>;
}

// Types for speaker data
interface SpeakerData {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio: string;
  tagLine: string;
  profilePicture: string;
  sessions: Array<{
    id: number;
    name: string;
  }>;
  isTopSpeaker: boolean;
  links: string[];
  questionAnswers: any[];
  categories: any[];
}

interface SessionEvaluation {
  title: {
    score: number;
    justification: string;
  };
  description: {
    score: number;
    justification: string;
  };
  keyTakeaways: {
    score: number;
    justification: string;
  };
  givenBefore: {
    score: number;
    justification: string;
  };
}

interface DatabaseSession {
  id: string;
  title: string;
  session_data: string; // JSON stringified session data
  status: 'new' | 'ready';
  evaluation_results: string | null; // JSON stringified evaluation results
  title_score: number | null;
  title_justification: string | null;
  description_score: number | null;
  description_justification: string | null;
  key_takeaways_score: number | null;
  key_takeaways_justification: string | null;
  given_before_score: number | null;
  given_before_justification: string | null;
  evaluation_score_total: number | null;
  created_at: string;
  completed_at: string | null;
}

interface DatabaseSpeaker {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  bio: string;
  tag_line: string;
  profile_picture: string;
  is_top_speaker: boolean;
  sessions: string; // JSON stringified array
  links: string; // JSON stringified array
  question_answers: string; // JSON stringified array
  categories: string; // JSON stringified array
  created_at: string;
}

interface SpeakerEvaluation {
  expertiseMatch: {
    score: number;
    justification: string;
  };
  topicsRelevance: {
    score: number;
    justification: string;
  };
}

interface DatabaseSpeakerEvaluation {
  id: string;
  speaker_id: string;
  profile_url: string;
  evaluations_expertise_match: number;
  evaluations_expertise_match_justification: string;
  evaluations_topics_relevance: number;
  evaluations_topics_relevance_justification: string;
  evaluations_data: string; // JSON stringified evaluation results
  created_at: string;
}

class DatabaseService {
  private db: any;
  private dbPath: string;

  constructor() {
    // Use a more reliable approach to find the project root
    // Try to find the sessions.db file by searching from current directory up
    let projectRoot = process.cwd();
    let dbPath = path.join(projectRoot, 'sessions.db');
    
    // If we're in .mastra/output, go up to the project root
    // this is required handling because when you run Mastra through the 
    // playground (via npm run dev), the current working directory is .mastra/output
    // while the database file should be in the root of the project
    if (projectRoot.includes('.mastra/output')) {
      projectRoot = path.resolve(projectRoot, '../../');
      dbPath = path.join(projectRoot, 'sessions.db');
    }
    
    this.dbPath = dbPath;
  }

  async initialize() {
    // Check if database file exists
    try {
      let exists = false;
      try {
        await fs.access(this.dbPath);
        exists = true;
      } catch (err) {
        exists = false;
      }
      console.log('🔍 Debug: Database file exists:', exists);
    } catch (error) {
      console.error('🔍 Debug: Error checking database file:', error);
    }
    
    // Open SQLite database
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    // Create speakers table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS speakers (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        full_name TEXT NOT NULL,
        bio TEXT NOT NULL,
        tag_line TEXT NOT NULL,
        profile_picture TEXT NOT NULL,
        is_top_speaker BOOLEAN NOT NULL DEFAULT 0,
        sessions TEXT NOT NULL,
        links TEXT NOT NULL,
        question_answers TEXT NOT NULL,
        categories TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // Create sessions table (without speaker fields)
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        session_data TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        evaluation_results TEXT,
        title_score INTEGER,
        title_justification TEXT,
        description_score INTEGER,
        description_justification TEXT,
        key_takeaways_score INTEGER,
        key_takeaways_justification TEXT,
        given_before_score INTEGER,
        given_before_justification TEXT,
        evaluation_score_total INTEGER,
        created_at TEXT NOT NULL,
        completed_at TEXT
      )
    `);

    // Create junction table for many-to-many relationship
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_speakers (
        session_id TEXT NOT NULL,
        speaker_id TEXT NOT NULL,
        PRIMARY KEY (session_id, speaker_id),
        FOREIGN KEY (session_id) REFERENCES sessions(id),
        FOREIGN KEY (speaker_id) REFERENCES speakers(id)
      )
    `);

    // Create speaker evaluations table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS evaluations_speakers_profile (
        id TEXT NOT NULL,
        speaker_id TEXT NOT NULL,
        profile_url TEXT NOT NULL,
        evaluations_expertise_match INTEGER NOT NULL,
        evaluations_expertise_match_justification TEXT NOT NULL,
        evaluations_topics_relevance INTEGER NOT NULL,
        evaluations_topics_relevance_justification TEXT NOT NULL,
        evaluations_data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (id, speaker_id)
      )
    `);

    console.log('✅ Database initialized');
  }

  async seedFromJson(jsonPath: string): Promise<void> {
    try {
      const dbContent = await fs.readFile(jsonPath, 'utf-8');
      const db = JSON.parse(dbContent);
      
      // Handle both old structure (with wrapper) and new structure (direct array)
      let sessions;
      if (db.sessions && Array.isArray(db.sessions)) {
        // Old structure: { "sessions": [...] }
        sessions = db.sessions[0].sessions;
      } else if (Array.isArray(db)) {
        // New structure: [...] (direct array)
        sessions = db[0].sessions;
      } else {
        throw new Error('Invalid database structure: expected array or object with sessions property');
      }
      
      console.log(`📋 Seeding ${sessions.length} sessions from JSON...`);
      
      for (const session of sessions) {
        await this.insertSession(session);
      }
      
      console.log('✅ Database seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  async seedSpeakersFromJson(jsonPath: string): Promise<void> {
    try {
      const speakersContent = await fs.readFile(jsonPath, 'utf-8');
      const speakers: SpeakerData[] = JSON.parse(speakersContent);
      
      console.log(`📋 Seeding ${speakers.length} speakers from JSON...`);
      
      for (const speaker of speakers) {
        await this.insertSpeaker(speaker);
      }
      
      console.log('✅ Speakers seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding speakers:', error);
      throw error;
    }
  }

  async insertSpeaker(speakerData: SpeakerData): Promise<void> {
    const now = new Date().toISOString();
    
    await this.db.run(`
      INSERT OR REPLACE INTO speakers (
        id, first_name, last_name, full_name, bio, tag_line, 
        profile_picture, is_top_speaker, sessions, links, question_answers, 
        categories, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      speakerData.id,
      speakerData.firstName,
      speakerData.lastName,
      speakerData.fullName,
      speakerData.bio,
      speakerData.tagLine,
      speakerData.profilePicture,
      speakerData.isTopSpeaker ? 1 : 0,
      JSON.stringify(speakerData.sessions),
      JSON.stringify(speakerData.links),
      JSON.stringify(speakerData.questionAnswers),
      JSON.stringify(speakerData.categories),
      now
    ]);
  }

  async insertSession(sessionData: SessionData): Promise<void> {
    const now = new Date().toISOString();
    
    await this.db.run(`
      INSERT OR REPLACE INTO sessions (
        id, title, session_data, status, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      sessionData.id,
      sessionData.title,
      JSON.stringify(sessionData),
      'new',
      now
    ]);
  }

  async correlateSpeakersToSessions(): Promise<void> {
    console.log('🔗 Correlating speakers to sessions...');
    
    // Get all sessions to correlate with speakers
    const allSessions = await this.db.all('SELECT * FROM sessions');
    
    for (const session of allSessions) {
      // Parse session data to get speakers array
      const sessionData = JSON.parse(session.session_data);
      const sessionSpeakers = sessionData.speakers || [];
      
      if (sessionSpeakers.length === 0) {
        continue; // Skip sessions without speakers
      }
      
      // Insert speaker-session relationships into junction table
      for (const sessionSpeaker of sessionSpeakers) {
        // Check if speaker exists
        const speaker = await this.db.get('SELECT id FROM speakers WHERE id = ?', [sessionSpeaker.id]);
        
        if (speaker) {
          // Insert into junction table
          await this.db.run(`
            INSERT OR IGNORE INTO session_speakers (session_id, speaker_id)
            VALUES (?, ?)
          `, [session.id, sessionSpeaker.id]);
        }
      }
    }
    
    console.log('✅ Speaker-session correlation completed');
  }

  async getUnprocessedSessions(): Promise<DatabaseSession[]> {
    const rows = await this.db.all(`
      SELECT * FROM sessions 
      WHERE status = 'new' 
      ORDER BY created_at ASC
    `);

    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      session_data: row.session_data,
      status: row.status,
      evaluation_results: row.evaluation_results,
      title_score: row.title_score,
      title_justification: row.title_justification,
      description_score: row.description_score,
      description_justification: row.description_justification,
      key_takeaways_score: row.key_takeaways_score,
      key_takeaways_justification: row.key_takeaways_justification,
      given_before_score: row.given_before_score,
      given_before_justification: row.given_before_justification,
      evaluation_score_total: row.evaluation_score_total,
      created_at: row.created_at,
      completed_at: row.completed_at
    }));
  }

  async getAllSpeakers(): Promise<DatabaseSpeaker[]> {
    const rows = await this.db.all(`
      SELECT * FROM speakers 
      ORDER BY full_name ASC
    `);

    return rows.map((row: any) => ({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      full_name: row.full_name,
      bio: row.bio,
      tag_line: row.tag_line,
      profile_picture: row.profile_picture,
      is_top_speaker: row.is_top_speaker === 1,
      sessions: row.sessions,
      links: row.links,
      question_answers: row.question_answers,
      categories: row.categories,
      created_at: row.created_at
    }));
  }

  async getSpeakerStats(): Promise<{
    total: number;
    withSessions: number;
    topSpeakers: number;
  }> {
    const totalResult = await this.db.get('SELECT COUNT(*) as count FROM speakers');
    const withSessionsResult = await this.db.get('SELECT COUNT(DISTINCT speaker_id) as count FROM session_speakers');
    const topSpeakersResult = await this.db.get("SELECT COUNT(*) as count FROM speakers WHERE is_top_speaker = 1");

    return {
      total: totalResult.count,
      withSessions: withSessionsResult.count,
      topSpeakers: topSpeakersResult.count
    };
  }

  async updateSessionEvaluation(
    sessionId: string, 
    evaluation: SessionEvaluation
  ): Promise<void> {
    const now = new Date().toISOString();
    
    // Calculate total score
    const totalScore = evaluation.title.score + 
                      evaluation.description.score + 
                      evaluation.keyTakeaways.score + 
                      evaluation.givenBefore.score;
    
    await this.db.run(`
      UPDATE sessions 
      SET 
        status = 'ready',
        evaluation_results = ?,
        title_score = ?,
        title_justification = ?,
        description_score = ?,
        description_justification = ?,
        key_takeaways_score = ?,
        key_takeaways_justification = ?,
        given_before_score = ?,
        given_before_justification = ?,
        evaluation_score_total = ?,
        completed_at = ?
      WHERE id = ?
    `, [
      JSON.stringify(evaluation),
      evaluation.title.score,
      evaluation.title.justification,
      evaluation.description.score,
      evaluation.description.justification,
      evaluation.keyTakeaways.score,
      evaluation.keyTakeaways.justification,
      evaluation.givenBefore.score,
      evaluation.givenBefore.justification,
      totalScore,
      now,
      sessionId
    ]);
  }

  async getSessionById(sessionId: string): Promise<DatabaseSession | null> {
    const row = await this.db.get(
      'SELECT * FROM sessions WHERE id = ?',
      [sessionId]
    );

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      title: row.title,
      session_data: row.session_data,
      status: row.status,
      evaluation_results: row.evaluation_results,
      title_score: row.title_score,
      title_justification: row.title_justification,
      description_score: row.description_score,
      description_justification: row.description_justification,
      key_takeaways_score: row.key_takeaways_score,
      key_takeaways_justification: row.key_takeaways_justification,
      given_before_score: row.given_before_score,
      given_before_justification: row.given_before_justification,
      evaluation_score_total: row.evaluation_score_total,
      created_at: row.created_at,
      completed_at: row.completed_at
    };
  }

  async getProcessedSessions(): Promise<DatabaseSession[]> {
    const rows = await this.db.all(`
      SELECT * FROM sessions 
      WHERE status = 'ready' 
      ORDER BY completed_at DESC
    `);

    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      session_data: row.session_data,
      status: row.status,
      evaluation_results: row.evaluation_results,
      title_score: row.title_score,
      title_justification: row.title_justification,
      description_score: row.description_score,
      description_justification: row.description_justification,
      key_takeaways_score: row.key_takeaways_score,
      key_takeaways_justification: row.key_takeaways_justification,
      given_before_score: row.given_before_score,
      given_before_justification: row.given_before_justification,
      evaluation_score_total: row.evaluation_score_total,
      created_at: row.created_at,
      completed_at: row.completed_at
    }));
  }

  async getSessionStats(): Promise<{
    total: number;
    processed: number;
    unprocessed: number;
  }> {
    const totalResult = await this.db.get('SELECT COUNT(*) as count FROM sessions');
    const processedResult = await this.db.get("SELECT COUNT(*) as count FROM sessions WHERE status = 'ready'");
    const unprocessedResult = await this.db.get("SELECT COUNT(*) as count FROM sessions WHERE status = 'new'");

    return {
      total: totalResult.count,
      processed: processedResult.count,
      unprocessed: unprocessedResult.count
    };
  }

  async getTotalSessions(): Promise<number> {
    const result = await this.db.get('SELECT COUNT(*) as count FROM sessions');
    return result.count;
  }

  async resetProcessedSessions(): Promise<number> {
    const result = await this.db.run(`
      UPDATE sessions 
      SET 
        status = 'new',
        evaluation_results = NULL,
        title_score = NULL,
        title_justification = NULL,
        description_score = NULL,
        description_justification = NULL,
        key_takeaways_score = NULL,
        key_takeaways_justification = NULL,
        given_before_score = NULL,
        given_before_justification = NULL,
        evaluation_score_total = NULL,
        completed_at = NULL
      WHERE status = 'ready'
    `);
    
    return result.changes;
  }

  async getSessionsWithSpeakers(): Promise<Array<DatabaseSession & { speakers: DatabaseSpeaker[] }>> {
    const rows = await this.db.all(`
      SELECT 
        s.*,
        sp.id as speaker_id,
        sp.first_name,
        sp.last_name,
        sp.full_name,
        sp.bio,
        sp.tag_line,
        sp.profile_picture,
        sp.is_top_speaker,
        sp.sessions,
        sp.links,
        sp.question_answers,
        sp.categories,
        sp.created_at as speaker_created_at
      FROM sessions s
      LEFT JOIN session_speakers ss ON s.id = ss.session_id
      LEFT JOIN speakers sp ON ss.speaker_id = sp.id
      ORDER BY s.created_at ASC
    `);

    // Group sessions with their speakers
    const sessionsMap = new Map<string, DatabaseSession & { speakers: DatabaseSpeaker[] }>();
    
    for (const row of rows) {
      const sessionId = row.id;
      
      if (!sessionsMap.has(sessionId)) {
        // Create session object
        const session: DatabaseSession = {
          id: row.id,
          title: row.title,
          session_data: row.session_data,
          status: row.status,
          evaluation_results: row.evaluation_results,
          title_score: row.title_score,
          title_justification: row.title_justification,
          description_score: row.description_score,
          description_justification: row.description_justification,
          key_takeaways_score: row.key_takeaways_score,
          key_takeaways_justification: row.key_takeaways_justification,
          given_before_score: row.given_before_score,
          given_before_justification: row.given_before_justification,
          evaluation_score_total: row.evaluation_score_total,
          created_at: row.created_at,
          completed_at: row.completed_at
        };
        
        sessionsMap.set(sessionId, { ...session, speakers: [] });
      }
      
      // Add speaker if exists
      if (row.speaker_id) {
        const speaker: DatabaseSpeaker = {
          id: row.speaker_id,
          first_name: row.first_name,
          last_name: row.last_name,
          full_name: row.full_name,
          bio: row.bio,
          tag_line: row.tag_line,
          profile_picture: row.profile_picture,
          is_top_speaker: row.is_top_speaker === 1,
          sessions: row.sessions,
          links: row.links,
          question_answers: row.question_answers,
          categories: row.categories,
          created_at: row.speaker_created_at
        };
        
        sessionsMap.get(sessionId)!.speakers.push(speaker);
      }
    }
    
    return Array.from(sessionsMap.values());
  }

  async getUnprocessedSessionsWithSpeakers(): Promise<Array<DatabaseSession & { speakers: DatabaseSpeaker[] }>> {
    const rows = await this.db.all(`
      SELECT 
        s.*,
        sp.id as speaker_id,
        sp.first_name,
        sp.last_name,
        sp.full_name,
        sp.bio,
        sp.tag_line,
        sp.profile_picture,
        sp.is_top_speaker,
        sp.sessions,
        sp.links,
        sp.question_answers,
        sp.categories,
        sp.created_at as speaker_created_at
      FROM sessions s
      LEFT JOIN session_speakers ss ON s.id = ss.session_id
      LEFT JOIN speakers sp ON ss.speaker_id = sp.id
      WHERE s.status = 'new'
      ORDER BY s.created_at ASC
    `);

    // Group sessions with their speakers
    const sessionsMap = new Map<string, DatabaseSession & { speakers: DatabaseSpeaker[] }>();
    
    for (const row of rows) {
      const sessionId = row.id;
      
      if (!sessionsMap.has(sessionId)) {
        // Create session object
        const session: DatabaseSession = {
          id: row.id,
          title: row.title,
          session_data: row.session_data,
          status: row.status,
          evaluation_results: row.evaluation_results,
          title_score: row.title_score,
          title_justification: row.title_justification,
          description_score: row.description_score,
          description_justification: row.description_justification,
          key_takeaways_score: row.key_takeaways_score,
          key_takeaways_justification: row.key_takeaways_justification,
          given_before_score: row.given_before_score,
          given_before_justification: row.given_before_justification,
          evaluation_score_total: row.evaluation_score_total,
          created_at: row.created_at,
          completed_at: row.completed_at
        };
        
        sessionsMap.set(sessionId, { ...session, speakers: [] });
      }
      
      // Add speaker if exists
      if (row.speaker_id) {
        const speaker: DatabaseSpeaker = {
          id: row.speaker_id,
          first_name: row.first_name,
          last_name: row.last_name,
          full_name: row.full_name,
          bio: row.bio,
          tag_line: row.tag_line,
          profile_picture: row.profile_picture,
          is_top_speaker: row.is_top_speaker === 1,
          sessions: row.sessions,
          links: row.links,
          question_answers: row.question_answers,
          categories: row.categories,
          created_at: row.speaker_created_at
        };
        
        sessionsMap.get(sessionId)!.speakers.push(speaker);
      }
    }
    
    return Array.from(sessionsMap.values());
  }

  async saveSpeakerEvaluation(
    speakerId: string,
    profileUrl: string,
    evaluation: SpeakerEvaluation
  ): Promise<void> {
    const now = new Date().toISOString();
    const evaluationId = uuidv7();
    
    await this.db.run(`
      INSERT OR REPLACE INTO evaluations_speakers_profile (
        id, speaker_id, profile_url, evaluations_expertise_match, 
        evaluations_expertise_match_justification, evaluations_topics_relevance,
        evaluations_topics_relevance_justification, evaluations_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      evaluationId,
      speakerId,
      profileUrl,
      evaluation.expertiseMatch.score,
      evaluation.expertiseMatch.justification,
      evaluation.topicsRelevance.score,
      evaluation.topicsRelevance.justification,
      JSON.stringify(evaluation),
      now
    ]);

    console.log(`✅ Saved speaker evaluation for ${speakerId}`);
  }

  async getSpeakerEvaluation(speakerId: string): Promise<DatabaseSpeakerEvaluation | null> {
    const row = await this.db.get(`
      SELECT * FROM evaluations_speakers_profile 
      WHERE speaker_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [speakerId]);

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      speaker_id: row.speaker_id,
      profile_url: row.profile_url,
      evaluations_expertise_match: row.evaluations_expertise_match,
      evaluations_expertise_match_justification: row.evaluations_expertise_match_justification,
      evaluations_topics_relevance: row.evaluations_topics_relevance,
      evaluations_topics_relevance_justification: row.evaluations_topics_relevance_justification,
      evaluations_data: row.evaluations_data,
      created_at: row.created_at
    };
  }

  async getSpeakerEvaluationStats(): Promise<{
    total: number;
    evaluated: number;
    averageExpertiseMatch: number;
    averageTopicsRelevance: number;
  }> {
    const totalSpeakers = await this.db.get('SELECT COUNT(*) as count FROM speakers');
    const evaluatedSpeakers = await this.db.get('SELECT COUNT(*) as count FROM evaluations_speakers_profile');
    
    const averages = await this.db.get(`
      SELECT 
        AVG(evaluations_expertise_match) as avg_expertise_match,
        AVG(evaluations_topics_relevance) as avg_topics_relevance
      FROM evaluations_speakers_profile
    `);

    return {
      total: totalSpeakers.count,
      evaluated: evaluatedSpeakers.count,
      averageExpertiseMatch: averages.avg_expertise_match || 0,
      averageTopicsRelevance: averages.avg_topics_relevance || 0
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
    }
  }
}

export { DatabaseService, type SessionData, type SessionEvaluation, type DatabaseSession, type SpeakerEvaluation, type DatabaseSpeakerEvaluation }; 