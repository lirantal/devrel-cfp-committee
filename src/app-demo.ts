import { mastra } from './mastra/index.js';

async function monitorWorkflow() {
  console.log('🔍 Clean Workflow Monitoring Demo');
  console.log('==================================\n');

  // Sample session data
  const sessionData = {
    id: "session-001",
    title: "Securing AI-Powered Applications: A Developer's Guide",
    description: "As AI becomes increasingly integrated into software applications...",
    questionAnswers: [
      {
        question: "What are the key takeaways from your session?",
        answer: "Understanding the fundamentals of React Native in modern development environments.",
        questionType: "Short_Text"
      }
    ],
    categories: [
      {
        name: "Have you given this talk before?",
        categoryItems: [{ name: "No" }]
      }
    ],
    speakers: [{ name: "Alex Chen" }]
  };

  // 1. Create the workflow run
  const workflow = mastra.getWorkflow('cfpEvaluationWorkflow');
  const run = await workflow.createRunAsync();

  console.log('📋 Workflow Details:');
  console.log(`   ID: ${workflow.id}`);
  console.log(`   Run ID: ${run.runId}`);
  console.log('');

  // 2. Set up monitoring BEFORE starting the workflow
  console.log('🔧 Setting up monitoring...');
  
  // Basic watch monitoring
  const unwatch = run.watch((event) => {
    console.log(`📊 Watch: ${event.type}`);
    console.log('Step completed:', event.payload.currentStep.id);
    console.log('Step status:', event.payload.currentStep.status);
    console.log('Step output:', JSON.stringify(event.payload.currentStep.output, null, 2));
  });

  // 3. Start the workflow (this triggers all monitoring)
  console.log('🚀 Starting workflow execution...\n');
  const result = await run.start({ inputData: { sessionData } });

  // 4. Clean up monitoring
  unwatch();
  
  // 5. Show final results
  console.log('\n\n📋 Final Result:');
  console.log(`   Status: ${result.status}`);
  if (result.status === 'success') {
    console.log(`   Result:`, JSON.stringify(result.result, null, 2));
  } else {
    console.log(`   Error:`, result);
  }
}

// Run the clean monitoring demo
monitorWorkflow().catch(console.error); 