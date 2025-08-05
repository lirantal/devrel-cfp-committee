import { SessionizeService } from './index';

async function example() {
  // Create a new SessionizeService instance
  const sessionizeService = new SessionizeService('http://localhost:3001/sessions');

  try {
    // Fetch all sessions
    const result = await sessionizeService.fetchSessions();
    
    console.log(`📊 Found ${result.totalSessions} total sessions`);
    console.log(`📁 Across ${result.groups.length} groups`);
    
    // Display group information
    result.groups.forEach(group => {
      console.log(`  - ${group.groupName}: ${group.sessionCount} sessions`);
    });
    
    // Display first few sessions
    console.log('\n🎤 Sample Sessions:');
    result.sessions.slice(0, 3).forEach(session => {
      console.log(`  - "${session.title}" by ${session.speakers[0]?.name || 'Unknown'}`);
      console.log(`    Status: ${session.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
  }
}

// Example with different URL
async function exampleWithCustomUrl() {
  const sessionizeService = new SessionizeService('https://api.sessionize.com/v1/events/abc123/sessions');
  
  try {
    const result = await sessionizeService.fetchSessions();
    console.log(`Fetched ${result.totalSessions} sessions from custom URL`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example showing URL management
async function exampleUrlManagement() {
  const sessionizeService = new SessionizeService('http://localhost:3001/sessions');
  
  console.log('Current URL:', sessionizeService.getSessionsUrl());
  
  // Change the URL
  sessionizeService.setSessionsUrl('https://api.sessionize.com/v1/events/xyz789/sessions');
  console.log('Updated URL:', sessionizeService.getSessionsUrl());
}

export { example, exampleWithCustomUrl, exampleUrlManagement }; 

await example();