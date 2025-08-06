import { DatabaseService } from '../services/database/index.js';

async function viewSpeakers() {
  console.log('🔍 Viewing speakers database contents...');
  
  const dbService = new DatabaseService();
  
  try {
    // Initialize database
    await dbService.initialize();
    
    // Get speaker stats
    const speakerStats = await dbService.getSpeakerStats();
    
    console.log('\n📊 Speaker Stats:');
    console.log(`   Total speakers: ${speakerStats.total}`);
    console.log(`   Speakers with sessions: ${speakerStats.withSessions}`);
    console.log(`   Top speakers: ${speakerStats.topSpeakers}`);
    
    // Get all speakers
    const allSpeakers = await dbService.getAllSpeakers();
    
    console.log('\n📋 All Speakers:');
    allSpeakers.forEach(speaker => {
      console.log(`   👤 ${speaker.full_name}`);
      console.log(`      ID: ${speaker.id}`);
      console.log(`      Tagline: ${speaker.tag_line}`);
      console.log(`      Top Speaker: ${speaker.is_top_speaker ? 'Yes' : 'No'}`);
      
      // Parse sessions to show count
      try {
        const sessions = JSON.parse(speaker.sessions);
        console.log(`      Sessions submitted: ${sessions.length}`);
        if (sessions.length > 0) {
          console.log(`      Session titles:`);
          sessions.forEach((session: any) => {
            console.log(`        - ${session.name} (ID: ${session.id})`);
          });
        }
      } catch (e) {
        console.log(`      Sessions submitted: 0`);
      }
      
      // Show bio preview (first 100 characters)
      const bioPreview = speaker.bio.length > 100 
        ? `${speaker.bio.substring(0, 100)}...` 
        : speaker.bio;
      console.log(`      Bio: ${bioPreview}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error viewing speakers:', error);
  } finally {
    await dbService.close();
  }
}

// Run the view function
viewSpeakers(); 