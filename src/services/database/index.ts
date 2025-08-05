import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';

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
  created_at: string;
  completed_at: string | null;
}

class DatabaseService {
  private db: any;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'sessions.db');
  }

  async initialize() {
    // Open SQLite database
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    // Create sessions table
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
        created_at TEXT NOT NULL,
        completed_at TEXT
      )
    `);

    console.log('✅ Database initialized');
  }

  async seedFromJson(jsonPath: string): Promise<void> {
    try {
      const dbContent = await fs.readFile(jsonPath, 'utf-8');
      const db = JSON.parse(dbContent);
      
      // Extract sessions from the nested structure
      const sessions = db.sessions[0].sessions;
      
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
      created_at: row.created_at,
      completed_at: row.completed_at
    }));
  }

  async updateSessionEvaluation(
    sessionId: string, 
    evaluation: SessionEvaluation
  ): Promise<void> {
    const now = new Date().toISOString();
    
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

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
    }
  }
}

export { DatabaseService, type SessionData, type SessionEvaluation, type DatabaseSession }; 