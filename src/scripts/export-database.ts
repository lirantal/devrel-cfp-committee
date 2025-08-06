import { DatabaseService } from '../services/database/index.js';
import fs from 'fs/promises';
import path from 'path';

interface ExportedSession {
  sessionData: any;
  evaluation: any;
  evaluationScoreTotal: number | null;
  speakers: {
    ids: string[];
    names: string[];
    taglines: string[];
    bios: string[];
    profilePictures: string[];
    links: string[][];
  };
}

async function exportDatabase() {
  console.log('📤 Starting database export...');
  
  const dbService = new DatabaseService();
  
  try {
    // Initialize database
    await dbService.initialize();
    
    // Get all sessions with speakers
    const sessionsWithSpeakers = await dbService.getSessionsWithSpeakers();
    
    console.log(`📋 Found ${sessionsWithSpeakers.length} sessions to export`);
    
    // Transform sessions to export format
    const exportedSessions: ExportedSession[] = sessionsWithSpeakers.map(session => {
      // Parse session data from JSON
      const sessionData = JSON.parse(session.session_data);
      
      // Parse evaluation results if available
      let evaluation = null;
      if (session.evaluation_results) {
        evaluation = JSON.parse(session.evaluation_results);
      }
      
      // Extract speaker information
      const speakerIds = session.speakers.map(s => s.id);
      const speakerNames = session.speakers.map(s => `${s.first_name} ${s.last_name}`);
      const speakerTaglines = session.speakers.map(s => s.tag_line);
      const speakerBios = session.speakers.map(s => s.bio);
      const speakerProfilePictures = session.speakers.map(s => s.profile_picture);
      const speakerLinks = session.speakers.map(s => {
        try {
          return JSON.parse(s.links);
        } catch (e) {
          return [];
        }
      });
      
      return {
        sessionData,
        evaluation,
        evaluationScoreTotal: session.evaluation_score_total,
        speakers: {
          ids: speakerIds,
          names: speakerNames,
          taglines: speakerTaglines,
          bios: speakerBios,
          profilePictures: speakerProfilePictures,
          links: speakerLinks
        }
      };
    });
    
    // Write to JSON file
    const exportPath = path.join(process.cwd(), 'sessions-export.json');
    await fs.writeFile(exportPath, JSON.stringify(exportedSessions, null, 2));
    
    console.log(`✅ Database exported to: ${exportPath}`);
    console.log(`📊 Export Summary:`);
    console.log(`   Total sessions: ${exportedSessions.length}`);
    console.log(`   Sessions with evaluations: ${exportedSessions.filter(s => s.evaluation !== null).length}`);
    console.log(`   Sessions without evaluations: ${exportedSessions.filter(s => s.evaluation === null).length}`);
    console.log(`   Sessions with speaker info: ${exportedSessions.filter(s => s.speakers.ids.length > 0).length}`);
    
  } catch (error) {
    console.error('❌ Error exporting database:', error);
    process.exit(1);
  } finally {
    await dbService.close();
  }
}

// Run the export function
exportDatabase(); 