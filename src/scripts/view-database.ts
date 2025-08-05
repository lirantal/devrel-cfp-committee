import { DatabaseService } from '../services/database/index.js';

async function viewDatabase() {
  console.log('🔍 Viewing database contents...');
  
  const dbService = new DatabaseService();
  
  try {
    // Initialize database
    await dbService.initialize();
    
    // Get session stats
    const stats = await dbService.getSessionStats();
    console.log('\n📊 Database Stats:');
    console.log(`   Total sessions: ${stats.total}`);
    console.log(`   Unprocessed: ${stats.unprocessed}`);
    console.log(`   Processed: ${stats.processed}`);
    
    // Get all sessions
    const allSessions = await dbService.getProcessedSessions();
    const unprocessedSessions = await dbService.getUnprocessedSessions();
    
    console.log('\n📋 Processed Sessions:');
    allSessions.forEach(session => {
      console.log(`   ✅ ${session.id}: ${session.title}`);
      console.log(`      Status: ${session.status}`);
      console.log(`      Completed: ${session.completed_at}`);
      if (session.title_score) {
        console.log(`      Title Score: ${session.title_score}/5`);
        console.log(`      Description Score: ${session.description_score}/5`);
        console.log(`      Key Takeaways Score: ${session.key_takeaways_score}/5`);
        console.log(`      Given Before Score: ${session.given_before_score}/5`);
        console.log(`      Total Score: ${session.evaluation_score_total}/20`);
      }
      console.log('');
    });
    
    console.log('\n📋 Unprocessed Sessions:');
    unprocessedSessions.forEach(session => {
      console.log(`   ⏳ ${session.id}: ${session.title}`);
      console.log(`      Status: ${session.status}`);
      console.log(`      Created: ${session.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error viewing database:', error);
  } finally {
    await dbService.close();
  }
}

// Run the view function
viewDatabase(); 