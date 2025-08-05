import { DatabaseService } from '../services/database/index.js';
import path from 'path';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  const dbService = new DatabaseService();
  
  try {
    // Initialize database
    await dbService.initialize();
    
    // Seed from JSON file
    const jsonPath = path.join(process.cwd(), '__fixtures__', 'db.json');
    await dbService.seedFromJson(jsonPath);
    
    // Get and display stats
    const stats = await dbService.getSessionStats();
    console.log('\n📊 Database Stats:');
    console.log(`   Total sessions: ${stats.total}`);
    console.log(`   Unprocessed: ${stats.unprocessed}`);
    console.log(`   Processed: ${stats.processed}`);
    
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