import fastq from 'fastq';
import { mastra } from './mastra/index.js';
import { DatabaseService, type SessionData, type SessionEvaluation } from './services/database/index.js';

// Global database service
const dbService = new DatabaseService();

// Worker function that processes a single session
async function processSession(dbSession: any): Promise<void> {
  try {
    console.log(`\n🔍 Processing session: ${dbSession.id} - ${dbSession.title}`);
    console.log(`   ${'='.repeat(60)}`);
    
    // Parse the session data from JSON
    const sessionData: SessionData = JSON.parse(dbSession.session_data);
    
    // Get the workflow and create a run
    const workflow = mastra.getWorkflow('cfpEvaluationWorkflow');
    const run = await workflow.createRunAsync();
    
    // Set up basic monitoring
    const unwatch = run.watch((event) => {
      console.log(`   📊 Workflow event:`, event.type);
    });    
    
    // Start the workflow with session data
    const result = await run.start({
      inputData: {
        sessionData
      }
    });
    
    // Clean up the watcher
    unwatch();
    
    if (result.status === 'success') {
      // Update the session in database with evaluation results
      await dbService.updateSessionEvaluation(dbSession.id, result.result);
      
      console.log(`\n✅ Completed evaluation for session: ${dbSession.id}`);
      
      // Display detailed evaluation results
      const evaluation = result.result;
      console.log(`   📊 Evaluation Results:`);
      console.log(`      Title: ${evaluation.title.score}/5 - ${evaluation.title.justification}`);
      console.log(`      Description: ${evaluation.description.score}/5 - ${evaluation.description.justification}`);
      console.log(`      Key Takeaways: ${evaluation.keyTakeaways.score}/5 - ${evaluation.keyTakeaways.justification}`);
      console.log(`      Given Before: ${evaluation.givenBefore.score}/5 - ${evaluation.givenBefore.justification}`);
      
      // Calculate total score
      const totalScore = evaluation.title.score + evaluation.description.score + evaluation.keyTakeaways.score + evaluation.givenBefore.score;
      console.log(`      Total Score: ${totalScore}/20`);
      
    } else {
      console.error(`❌ Workflow failed for session ${dbSession.id}:`, result);
    }
    
  } catch (error) {
    console.error(`❌ Error processing session ${dbSession.id}:`, error);
  }
}

// Create the queue with the worker function, process 1 session at a time
const queue = fastq.promise(processSession, 1);

// Main function
async function main() {
  console.log('🚀 Starting CFP Session Processing...');
  
  try {
    // Initialize database
    await dbService.initialize();
    
    // Get session stats
    const stats = await dbService.getSessionStats();
    console.log(`📊 Database Stats:`);
    console.log(`   Total sessions: ${stats.total}`);
    console.log(`   Unprocessed: ${stats.unprocessed}`);
    console.log(`   Processed: ${stats.processed}`);
    
    if (stats.unprocessed === 0) {
      console.log('✅ All sessions have been processed!');
      return;
    }
    
    // Get unprocessed sessions
    const unprocessedSessions = await dbService.getUnprocessedSessions();
    console.log(`📋 Found ${unprocessedSessions.length} unprocessed sessions`);
    
    // Add all unprocessed sessions to the queue
    for (const session of unprocessedSessions) {
      // For testing purposes we will only process the first session
      if (session.id !== 'session-001') continue;
      
      queue.push(session);
    }
    
    // Wait for all sessions to be processed
    await queue.drained();
    
    console.log(`\n🎉 Processing complete!`);
    
    // Get updated stats
    const finalStats = await dbService.getSessionStats();
    console.log(`📊 Final Stats:`);
    console.log(`   Total sessions: ${finalStats.total}`);
    console.log(`   Unprocessed: ${finalStats.unprocessed}`);
    console.log(`   Processed: ${finalStats.processed}`);
    
    // Get processed sessions for summary
    const processedSessions = await dbService.getProcessedSessions();
    
    if (processedSessions.length > 0) {
      console.log('\n📈 Summary:');
      
      // Calculate average scores
      const avgTitleScore = processedSessions.reduce((sum, session) => 
        sum + (session.title_score || 0), 0) / processedSessions.length;
      const avgDescriptionScore = processedSessions.reduce((sum, session) => 
        sum + (session.description_score || 0), 0) / processedSessions.length;
      const avgKeyTakeawaysScore = processedSessions.reduce((sum, session) => 
        sum + (session.key_takeaways_score || 0), 0) / processedSessions.length;
      const avgGivenBeforeScore = processedSessions.reduce((sum, session) => 
        sum + (session.given_before_score || 0), 0) / processedSessions.length;
      
      console.log(`   Average Title Score: ${avgTitleScore.toFixed(2)}/5`);
      console.log(`   Average Description Score: ${avgDescriptionScore.toFixed(2)}/5`);
      console.log(`   Average Key Takeaways Score: ${avgKeyTakeawaysScore.toFixed(2)}/5`);
      console.log(`   Average Given Before Score: ${avgGivenBeforeScore.toFixed(2)}/5`);
      
      const highQualitySessions = processedSessions.filter(session => 
        (session.title_score || 0) + (session.description_score || 0) + 
        (session.key_takeaways_score || 0) + (session.given_before_score || 0) >= 16);
      console.log(`   High Quality Sessions (≥16/20): ${highQualitySessions.length}`);
    }
    
  } catch (error) {
    console.error('❌ Application error:', error);
    process.exit(1);
  } finally {
    await dbService.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  await queue.drained();
  await dbService.close();
  process.exit(0);
});

// Start the application
main().catch(error => {
  console.error('❌ Application error:', error);
  process.exit(1);
}); 