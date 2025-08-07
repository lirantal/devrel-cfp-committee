import { mastra } from './mastra';

async function testWorkflowWithSpeakers() {
  try {
    console.log('🚀 Testing CFP Evaluation Workflow with Parallel Speaker Assessment...');
    
    const workflow = mastra.getWorkflow('cfpEvaluationWorkflow');
    const run = await workflow.createRunAsync();
    
    // Sample session data for testing
    const testSessionData = {
      sessionData: {
        id: 'test-session-1',
        title: 'Advanced JavaScript Patterns',
        description: 'Learn advanced JavaScript patterns and best practices for modern web development.',
        questionAnswers: [
          {
            question: 'What are the key takeaways?',
            answer: 'Understanding closures, prototypes, and modern ES6+ features',
            questionType: 'text'
          }
        ],
        categories: [
          {
            name: 'Have you given this talk before?',
            categoryItems: [
              { name: 'Yes, at JSConf 2023' }
            ]
          }
        ],
        speakers: [
          { name: 'John Doe' }
        ]
      }
    };
    
    console.log('📝 Starting parallel workflow execution...');
    console.log('   - Session evaluation will run in parallel with speaker assessment');
    console.log('   - Speaker assessment will process all speakers with concurrency limit of 2');
    
    const result = await run.start({ inputData: testSessionData });
    
    if (result.status === 'success') {
      console.log('✅ Workflow completed successfully!');
      console.log('📊 Results:');
      console.log('Session Evaluation:', result.result.sessionEvaluation);
      console.log('Speaker Assessments:', result.result.speakerAssessments);
      console.log(`Total speakers assessed: ${result.result.speakerAssessments.length}`);
    } else if (result.status === 'failed') {
      console.error('❌ Workflow failed:', result.error);
    } else {
      console.log('⏸️ Workflow suspended:', result.status);
    }
    
    // Test the standalone speaker assessment workflow
    console.log('\n🧪 Testing standalone Speaker Assessment Workflow...');
    const speakerWorkflow = mastra.getWorkflow('speakerAssessmentWorkflow');
    const speakerRun = await speakerWorkflow.createRunAsync();
    
    const speakerResult = await speakerRun.start({ inputData: testSessionData });
    
    if (speakerResult.status === 'success') {
      console.log(`Standalone speaker assessment completed: ${speakerResult.result.length} speakers assessed`);
    } else if (speakerResult.status === 'failed') {
      console.error('❌ Speaker assessment workflow failed:', speakerResult.error);
    } else {
      console.log('⏸️ Speaker assessment workflow suspended:', speakerResult.status);
    }
    
  } catch (error) {
    console.error('❌ Workflow execution failed:', error);
  }
}

testWorkflowWithSpeakers();
