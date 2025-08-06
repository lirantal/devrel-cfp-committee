import fs from 'fs/promises';
import path from 'path';

interface SessionData {
  id: string;
  title: string;
  description: string;
  status: string;
  speakers: Array<{
    id: string;
    name: string;
  }>;
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
  [key: string]: any; // Allow other fields
}

interface DatabaseData {
  sessions: Array<{
    groupId: string | null;
    groupName: string;
    sessions: SessionData[];
  }>;
}

async function exportFilteredDatabase() {
  // Get status filter from command line argument, default to "Nominated"
  const statusFilter = process.argv[2] || 'Nominated';
  
  console.log(`🔍 Filtering database for sessions with status "${statusFilter}"...`);
  
  try {
    // Read the original db.json file
    const dbPath = path.join(process.cwd(), '__fixtures__', 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const dbData: DatabaseData = JSON.parse(dbContent);
    
    // Extract all sessions from the nested structure
    const allSessions: SessionData[] = [];
    for (const group of dbData.sessions) {
      allSessions.push(...group.sessions);
    }
    
    console.log(`📋 Found ${allSessions.length} total sessions`);
    
    // Show all available statuses
    const availableStatuses = [...new Set(allSessions.map(s => s.status))];
    console.log(`📊 Available statuses: ${availableStatuses.join(', ')}`);
    
    // Filter sessions with the specified status
    const filteredSessions = allSessions.filter(session => session.status === statusFilter);
    
    console.log(`✅ Found ${filteredSessions.length} sessions with status "${statusFilter}"`);
    
    if (filteredSessions.length === 0) {
      console.log(`⚠️  No sessions found with status "${statusFilter}"`);
      return;
    }
    
    // Create filtered database structure
    const filteredDbData: DatabaseData = {
      sessions: [
        {
          groupId: null,
          groupName: `${statusFilter} Sessions`,
          sessions: filteredSessions
        }
      ]
    };
    
    // Create filename based on status
    const statusSlug = statusFilter.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const outputPath = path.join(process.cwd(), '__fixtures__', `db-${statusSlug}.json`);
    await fs.writeFile(outputPath, JSON.stringify(filteredDbData, null, 2));
    
    console.log(`✅ Filtered database exported to: ${outputPath}`);
    console.log(`\n📊 ${statusFilter} Sessions:`);
    filteredSessions.forEach(session => {
      console.log(`   📝 ${session.id}: ${session.title}`);
      console.log(`      Status: ${session.status}`);
      if (session.speakers && session.speakers.length > 0) {
        const speakerNames = session.speakers.map(s => s.name).join(', ');
        console.log(`      Speakers: ${speakerNames}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error filtering database:', error);
    process.exit(1);
  }
}

// Run the filter function
exportFilteredDatabase(); 