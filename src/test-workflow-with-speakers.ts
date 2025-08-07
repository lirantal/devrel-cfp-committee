import { mastra } from './mastra';

async function testWorkflowWithSpeakers() {
  try {
    console.log('🚀 Testing CFP Evaluation Workflow with Speaker Assessment...');
    
    const workflow = mastra.getWorkflow('cfp-evaluation-workflow');
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
    
    console.log('📝 Starting workflow execution...');
    const result = await run.start({ inputData: testSessionData });
    
    console.log('✅ Workflow completed successfully!');
    console.log('📊 Results:');
    console.log('Session Evaluation:', result.output.sessionEvaluation);
    console.log('Speaker Assessments:', result.output.speakerAssessments);
    console.log(`Total speakers assessed: ${result.output.speakerAssessments.length}`);
    
  } catch (error) {
    console.error('❌ Workflow execution failed:', error);
  }
}

testWorkflowWithSpeakers();
