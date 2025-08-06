import { DatabaseService } from '../services/database/index.js';
import path from 'path';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  const dbService = new DatabaseService();
  
  try {
    // Initialize database
    await dbService.initialize();
    
    // Seed sessions from JSON file
    const sessionsJsonPath = path.join(process.cwd(), '__fixtures__', 'db.json');
    await dbService.seedFromJson(sessionsJsonPath);
    
    // Seed speakers from JSON file
    const speakersJsonPath = path.join(process.cwd(), '__fixtures__', 'speakers.json');
    await dbService.seedSpeakersFromJson(speakersJsonPath);
    
    // Correlate speakers to sessions
    await dbService.correlateSpeakersToSessions();
    
    // Get and display stats
    const sessionStats = await dbService.getSessionStats();
    const speakerStats = await dbService.getSpeakerStats();
    
    console.log('\n📊 Database Stats:');
    console.log(`   Total sessions: ${sessionStats.total}`);
    console.log(`   Unprocessed sessions: ${sessionStats.unprocessed}`);
    console.log(`   Processed sessions: ${sessionStats.processed}`);
    console.log(`   Total speakers: ${speakerStats.total}`);
    console.log(`   Speakers with sessions: ${speakerStats.withSessions}`);
    console.log(`   Top speakers: ${speakerStats.topSpeakers}`);
    
    console.log('\n✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await dbService.close();
  }
}

// Run the seed function
seedDatabase(); 