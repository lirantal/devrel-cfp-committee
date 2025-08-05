import fastq from 'fastq';
import { mastra } from './mastra/index.js';
import fs from 'fs/promises';
import path from 'path';

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
  sessionData: SessionData;
  evaluation: any; // Will be the output from the Mastra workflow
  processedAt: string;
}

// Global storage for all processed sessions
const processedSessions: SessionEvaluation[] = [];

// Worker function that processes a single session
async function processSession(sessionData: SessionData): Promise<void> {
  try {
    console.log(`\n🔍 Processing session: ${sessionData.id} - ${sessionData.title}`);
    console.log(`   ${'='.repeat(60)}`);
    
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
      // Store the session data and evaluation result
      const sessionEvaluation: SessionEvaluation = {
        sessionData,
        evaluation: result.result,
        processedAt: new Date().toISOString()
      };
      
      processedSessions.push(sessionEvaluation);
      
      console.log(`\n✅ Completed evaluation for session: ${sessionData.id}`);
      
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
      console.error(`❌ Workflow failed for session ${sessionData.id}:`, result);
    }
    
  } catch (error) {
    console.error(`❌ Error processing session ${sessionData.id}:`, error);
  }
}

// Create the queue with the worker function, process 1 session at a time
const queue = fastq.promise(processSession, 1);

// Function to load session data from the JSON file
async function loadSessions(): Promise<SessionData[]> {
  try {
    const dbPath = path.join(process.cwd(), '__fixtures__', 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    // Extract sessions from the nested structure
    const sessions = db.sessions[0].sessions;
    return sessions;
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
}

// Function to save processed results
async function saveResults(): Promise<void> {
  try {
    const resultsPath = path.join(process.cwd(), 'processed-sessions.json');
    await fs.writeFile(resultsPath, JSON.stringify(processedSessions, null, 2));
    console.log(`💾 Results saved to: ${resultsPath}`);
  } catch (error) {
    console.error('Error saving results:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 Starting CFP Session Processing...');
  
  // Load all sessions
  const sessions = await loadSessions();
  console.log(`📋 Loaded ${sessions.length} sessions to process`);
  
  // Add all sessions to the queue
  for (const session of sessions) {
    // For testing purposes we will only process the first session
    if (session.id !== 'session-001') continue;
    
    queue.push(session);
  }
  
  // Wait for all sessions to be processed
  await queue.drained();
  
  console.log(`\n🎉 Processing complete!`);
  console.log(`📊 Processed ${processedSessions.length} sessions`);
  
  // Save results
  await saveResults();
  
  // Print summary
  console.log('\n📈 Summary:');
  const avgOverallQuality = processedSessions.reduce((sum, session) => 
    sum + session.evaluation.overallQuality.score, 0) / processedSessions.length;
  console.log(`   Average Overall Quality: ${avgOverallQuality.toFixed(2)}/5`);
  
  const highQualitySessions = processedSessions.filter(session => 
    session.evaluation.overallQuality.score >= 4);
  console.log(`   High Quality Sessions (≥4/5): ${highQualitySessions.length}`);
  
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  await queue.drained();
  await saveResults();
  process.exit(0);
});

// Start the application
main().catch(error => {
  console.error('❌ Application error:', error);
  process.exit(1);
}); 