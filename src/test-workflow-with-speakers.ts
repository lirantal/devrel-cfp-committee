import { mastra } from './mastra';

async function testWorkflows() {
  try {
    console.log('🚀 Testing CFP Evaluation Workflow...');
    
    const cfpWorkflow = mastra.getWorkflow('cfpEvaluationWorkflow');
    const cfpRun = await cfpWorkflow.createRunAsync();
    
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
    
    console.log('📝 Starting CFP evaluation workflow...');
    const cfpResult = await cfpRun.start({ inputData: testSessionData });
    
    if (cfpResult.status === 'success') {
      console.log('✅ CFP Evaluation completed successfully!');
      console.log('📊 CFP Results:', cfpResult.result);
    } else if (cfpResult.status === 'failed') {
      console.error('❌ CFP Evaluation failed:', cfpResult.error);
    } else {
      console.log('⏸️ CFP Evaluation suspended:', cfpResult.status);
    }
    
    // Test the speaker evaluation workflow
    console.log('\n🧪 Testing Speaker Evaluation Workflow...');
    const speakerWorkflow = mastra.getWorkflow('speakerEvaluationWorkflow');
    const speakerRun = await speakerWorkflow.createRunAsync();
    
    console.log('📝 Starting speaker evaluation workflow...');
    console.log('   - Will fetch all speakers from database');
    console.log('   - Will assess each speaker with concurrency limit of 2');
    
    const speakerResult = await speakerRun.start({ inputData: {} });
    
    if (speakerResult.status === 'success') {
      console.log('✅ Speaker Evaluation completed successfully!');
      console.log(`📊 Speaker Results: ${speakerResult.result.length} speakers assessed`);
      console.log('Sample assessment:', speakerResult.result[0]);
    } else if (speakerResult.status === 'failed') {
      console.error('❌ Speaker Evaluation failed:', speakerResult.error);
    } else {
      console.log('⏸️ Speaker Evaluation suspended:', speakerResult.status);
    }
    
  } catch (error) {
    console.error('❌ Workflow execution failed:', error);
  }
}

testWorkflows();
