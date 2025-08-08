import { DatabaseService, type SpeakerEvaluation, type DatabaseSpeakerEvaluation } from '../services/database';

async function testSpeakerEvaluationDB() {
  console.log('🧪 Testing Speaker Evaluation Database Functionality...\n');

  const dbService = new DatabaseService();
  await dbService.initialize();

  try {
    // Test 1: Save a speaker evaluation
    console.log('1. Testing saveSpeakerEvaluation...');
    const testEvaluation: SpeakerEvaluation = {
      expertiseMatch: {
        score: 3,
        justification: 'Speaker has strong JavaScript expertise based on their profile'
      },
      topicsRelevance: {
        score: 2,
        justification: 'Speaker covers relevant topics but could be more focused on JS'
      }
    };

    await dbService.saveSpeakerEvaluation(
      'test-speaker-123',
      'https://sessionize.com/test-speaker',
      testEvaluation
    );
    console.log('✅ Successfully saved speaker evaluation');

    // Test 2: Retrieve the latest evaluation
    console.log('\n2. Testing getSpeakerEvaluation (latest)...');
    const retrievedEvaluation = await dbService.getSpeakerEvaluation('test-speaker-123') as DatabaseSpeakerEvaluation | null;
    
    if (retrievedEvaluation) {
      console.log('✅ Successfully retrieved latest speaker evaluation:');
      console.log(`   - ID: ${retrievedEvaluation.id}`);
      console.log(`   - Speaker ID: ${retrievedEvaluation.speaker_id}`);
      console.log(`   - Profile URL: ${retrievedEvaluation.profile_url}`);
      console.log(`   - Expertise Match Score: ${retrievedEvaluation.evaluations_expertise_match}`);
      console.log(`   - Topics Relevance Score: ${retrievedEvaluation.evaluations_topics_relevance}`);
      console.log(`   - Created At: ${retrievedEvaluation.created_at}`);
    } else {
      console.log('❌ Failed to retrieve speaker evaluation');
    }

    // Test 2b: Save a second evaluation for the same speaker
    console.log('\n2b. Testing multiple evaluations for same speaker...');
    const secondEvaluation: SpeakerEvaluation = {
      expertiseMatch: {
        score: 2,
        justification: 'Updated assessment: Speaker has moderate JavaScript expertise'
      },
      topicsRelevance: {
        score: 3,
        justification: 'Updated assessment: Speaker covers highly relevant topics'
      }
    };

    await dbService.saveSpeakerEvaluation(
      'test-speaker-123',
      'https://sessionize.com/test-speaker',
      secondEvaluation
    );
    console.log('✅ Successfully saved second evaluation');

    // Test 2c: Get all evaluations for the speaker
    console.log('\n2c. Testing getSpeakerEvaluation with all evaluations...');
    const allEvaluations = await dbService.getSpeakerEvaluation('test-speaker-123', { latest: false }) as DatabaseSpeakerEvaluation[];
    console.log(`✅ Found ${allEvaluations.length} evaluations for test-speaker-123:`);
    allEvaluations.forEach((evaluation, index) => {
      console.log(`   Evaluation ${index + 1}:`);
      console.log(`     - ID: ${evaluation.id}`);
      console.log(`     - Expertise Match: ${evaluation.evaluations_expertise_match}`);
      console.log(`     - Topics Relevance: ${evaluation.evaluations_topics_relevance}`);
      console.log(`     - Created At: ${evaluation.created_at}`);
    });

    // Test 2d: Get evaluation count
    console.log('\n2d. Testing getSpeakerEvaluationCount...');
    const evaluationCount = await dbService.getSpeakerEvaluationCount('test-speaker-123');
    console.log(`✅ Speaker has ${evaluationCount} total evaluations`);

    // Test 3: Get evaluation stats
    console.log('\n3. Testing getSpeakerEvaluationStats...');
    const stats = await dbService.getSpeakerEvaluationStats();
    console.log('✅ Speaker Evaluation Stats:');
    console.log(`   - Total Speakers: ${stats.total}`);
    console.log(`   - Evaluated Speakers: ${stats.evaluated}`);
    console.log(`   - Average Expertise Match: ${stats.averageExpertiseMatch.toFixed(2)}`);
    console.log(`   - Average Topics Relevance: ${stats.averageTopicsRelevance.toFixed(2)}`);

    // Test 4: Test with non-existent speaker
    console.log('\n4. Testing getSpeakerEvaluation with non-existent speaker...');
    const nonExistentEvaluation = await dbService.getSpeakerEvaluation('non-existent-speaker');
    if (nonExistentEvaluation === null) {
      console.log('✅ Correctly returned null for non-existent speaker');
    } else {
      console.log('❌ Unexpectedly returned data for non-existent speaker');
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await dbService.close();
  }
}

// Run the test
testSpeakerEvaluationDB().catch(console.error);
