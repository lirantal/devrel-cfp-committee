#!/usr/bin/env node

import { DatabaseService } from '../services/database/index.js';

async function resetProcessedSessions() {
  console.log('🔄 Resetting processed sessions to "new" state...');
  
  try {
    const dbService = new DatabaseService();
    await dbService.initialize();
    
    // Get count of processed sessions before reset
    const processedSessions = await dbService.getProcessedSessions();
    const processedCount = processedSessions.length;
    
    if (processedCount === 0) {
      console.log('ℹ️  No processed sessions found. Nothing to reset.');
      return;
    }
    
    console.log(`📋 Found ${processedCount} processed sessions to reset`);
    
    // Reset all processed sessions to "new" state
    const resetCount = await dbService.resetProcessedSessions();
    
    console.log(`✅ Successfully reset ${resetCount} sessions to "new" state`);
    
    // Show updated database stats
    const unprocessedSessions = await dbService.getUnprocessedSessions();
    const totalSessions = await dbService.getTotalSessions();
    
    console.log('\n📊 Updated Database Stats:');
    console.log(`   Total sessions: ${totalSessions}`);
    console.log(`   Unprocessed sessions: ${unprocessedSessions.length}`);
    console.log(`   Processed sessions: ${totalSessions - unprocessedSessions.length}`);
    
    console.log('\n🔄 Reset completed successfully!');
    console.log('💡 You can now run "npm run process-cfp" to reprocess all sessions.');
    
  } catch (error) {
    console.error('❌ Error resetting processed sessions:', error);
    process.exit(1);
  }
}

// Run the reset function
resetProcessedSessions(); 