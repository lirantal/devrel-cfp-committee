import { DatabaseService } from '../services/database/index.js';
import fs from 'fs/promises';
import path from 'path';

interface ExportedSession {
  sessionData: any;
  evaluation: any;
  evaluationScoreTotal: number | null;
}

async function exportDatabase() {
  console.log('📤 Starting database export...');
  
  const dbService = new DatabaseService();
  
  try {
    // Initialize database
    await dbService.initialize();
    
    // Get all sessions (both processed and unprocessed)
    const processedSessions = await dbService.getProcessedSessions();
    const unprocessedSessions = await dbService.getUnprocessedSessions();
    
    const allSessions = [...processedSessions, ...unprocessedSessions];
    
    console.log(`📋 Found ${allSessions.length} sessions to export`);
    console.log(`   Processed: ${processedSessions.length}`);
    console.log(`   Unprocessed: ${unprocessedSessions.length}`);
    
    // Transform sessions to export format
    const exportedSessions: ExportedSession[] = allSessions.map(session => {
      // Parse session data from JSON
      const sessionData = JSON.parse(session.session_data);
      
      // Parse evaluation results if available
      let evaluation = null;
      if (session.evaluation_results) {
        evaluation = JSON.parse(session.evaluation_results);
      }
      
      return {
        sessionData,
        evaluation,
        evaluationScoreTotal: session.evaluation_score_total
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
    
  } catch (error) {
    console.error('❌ Error exporting database:', error);
    process.exit(1);
  } finally {
    await dbService.close();
  }
}

// Run the export function
exportDatabase(); 