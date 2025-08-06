import { DatabaseService } from '../services/database/index.js';

function formatSpeakerNames(speakers: any[]): string {
  return speakers.map(speaker => `${speaker.first_name} ${speaker.last_name}`).join(', ');
}

function formatSpeakerTaglines(speakers: any[]): string {
  return speakers.map(speaker => speaker.tag_line).join(', ');
}

async function viewDatabase() {
  console.log('🔍 Viewing database contents...');
  
  const dbService = new DatabaseService();
  
  try {
    // Initialize database
    await dbService.initialize();
    
    // Get session stats
    const sessionStats = await dbService.getSessionStats();
    const speakerStats = await dbService.getSpeakerStats();
    
    console.log('\n📊 Database Stats:');
    console.log(`   Total sessions: ${sessionStats.total}`);
    console.log(`   Unprocessed: ${sessionStats.unprocessed}`);
    console.log(`   Processed: ${sessionStats.processed}`);
    console.log(`   Total speakers: ${speakerStats.total}`);
    console.log(`   Speakers with sessions: ${speakerStats.withSessions}`);
    console.log(`   Top speakers: ${speakerStats.topSpeakers}`);
    
    // Get all sessions with speakers
    const allSessionsWithSpeakers = await dbService.getSessionsWithSpeakers();
    const processedSessions = allSessionsWithSpeakers.filter(s => s.status === 'ready');
    const unprocessedSessions = allSessionsWithSpeakers.filter(s => s.status === 'new');
    
    console.log('\n📋 Processed Sessions:');
    processedSessions.forEach(session => {
      console.log(`   ✅ ${session.id}: ${session.title}`);
      console.log(`      Status: ${session.status}`);
      console.log(`      Completed: ${session.completed_at}`);
      
      if (session.speakers.length > 0) {
        console.log(`      Speakers: ${formatSpeakerNames(session.speakers)}`);
        console.log(`      Taglines: ${formatSpeakerTaglines(session.speakers)}`);
      }
      
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
      
      if (session.speakers.length > 0) {
        console.log(`      Speakers: ${formatSpeakerNames(session.speakers)}`);
        console.log(`      Taglines: ${formatSpeakerTaglines(session.speakers)}`);
      }
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