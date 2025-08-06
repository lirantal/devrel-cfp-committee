import { DatabaseService } from '../services/database/index.js';
import fs from 'fs/promises';
import path from 'path';

interface CsvRow {
  // Session data fields
  id: string;
  title: string;
  description: string;
  speakers: string;
  categories: string;
  questionAnswers: string;
  
  // Speaker fields (many-to-many)
  speaker_ids: string;
  speaker_names: string;
  speaker_taglines: string;
  speaker_bios: string;
  speaker_profile_pictures: string;
  speaker_links: string;
  
  // Evaluation fields
  status: string;
  title_score: number | null;
  title_justification: string | null;
  description_score: number | null;
  description_justification: string | null;
  key_takeaways_score: number | null;
  key_takeaways_justification: string | null;
  given_before_score: number | null;
  given_before_justification: string | null;
  evaluation_score_total: number | null;
  
  // Timestamps
  created_at: string;
  completed_at: string | null;
}

function escapeCsvField(field: string): string {
  // Replace newlines with spaces and escape quotes
  const cleaned = field.replace(/\r?\n/g, ' ').replace(/"/g, '""');
  // Wrap in quotes if it contains comma, quote, or newline
  if (cleaned.includes(',') || cleaned.includes('"') || cleaned.includes('\n')) {
    return `"${cleaned}"`;
  }
  return cleaned;
}

function formatSpeakers(speakers: any[]): string {
  return speakers.map(speaker => speaker.name).join('; ');
}

function formatCategories(categories: any[]): string {
  return categories.map(category => 
    `${category.name}: ${category.categoryItems.map((item: any) => item.name).join(', ')}`
  ).join('; ');
}

function formatQuestionAnswers(questionAnswers: any[]): string {
  return questionAnswers.map(qa => 
    `${qa.question}: ${qa.answer || 'No answer'}`
  ).join('; ');
}

function formatSpeakerArrays(data: string[]): string {
  return data.join('; ');
}

async function exportDatabaseCsv() {
  console.log('📤 Starting CSV database export...');
  
  const dbService = new DatabaseService();
  
  try {
    // Initialize database
    await dbService.initialize();
    
    // Get all sessions with speakers
    const sessionsWithSpeakers = await dbService.getSessionsWithSpeakers();
    
    console.log(`📋 Found ${sessionsWithSpeakers.length} sessions to export`);
    
    // Transform sessions to CSV format
    const csvRows: CsvRow[] = sessionsWithSpeakers.map(session => {
      // Parse session data from JSON
      const sessionData = JSON.parse(session.session_data);
      
      // Extract speaker information
      const speakerIds = session.speakers.map(s => s.id);
      const speakerNames = session.speakers.map(s => `${s.first_name} ${s.last_name}`);
      const speakerTaglines = session.speakers.map(s => s.tag_line);
      const speakerBios = session.speakers.map(s => s.bio);
      const speakerProfilePictures = session.speakers.map(s => s.profile_picture);
      const speakerLinks = session.speakers.map(s => {
        try {
          const links = JSON.parse(s.links);
          return Array.isArray(links) ? links.join(' ') : '';
        } catch (e) {
          return '';
        }
      });
      
      return {
        // Session data fields
        id: sessionData.id,
        title: sessionData.title,
        description: sessionData.description,
        speakers: formatSpeakers(sessionData.speakers),
        categories: formatCategories(sessionData.categories),
        questionAnswers: formatQuestionAnswers(sessionData.questionAnswers),
        
        // Speaker fields (many-to-many)
        speaker_ids: formatSpeakerArrays(speakerIds),
        speaker_names: formatSpeakerArrays(speakerNames),
        speaker_taglines: formatSpeakerArrays(speakerTaglines),
        speaker_bios: formatSpeakerArrays(speakerBios),
        speaker_profile_pictures: formatSpeakerArrays(speakerProfilePictures),
        speaker_links: formatSpeakerArrays(speakerLinks),
        
        // Evaluation fields
        status: session.status,
        title_score: session.title_score,
        title_justification: session.title_justification,
        description_score: session.description_score,
        description_justification: session.description_justification,
        key_takeaways_score: session.key_takeaways_score,
        key_takeaways_justification: session.key_takeaways_justification,
        given_before_score: session.given_before_score,
        given_before_justification: session.given_before_justification,
        evaluation_score_total: session.evaluation_score_total,
        
        // Timestamps
        created_at: session.created_at,
        completed_at: session.completed_at
      };
    });
    
    // Create CSV content
    const headers = [
      'id', 'title', 'description', 'speakers', 'categories', 'questionAnswers',
      'speaker_ids', 'speaker_names', 'speaker_taglines', 'speaker_bios', 'speaker_profile_pictures', 'speaker_links',
      'status', 'title_score', 'title_justification', 'description_score', 'description_justification',
      'key_takeaways_score', 'key_takeaways_justification', 'given_before_score', 'given_before_justification',
      'evaluation_score_total', 'created_at', 'completed_at'
    ];
    
    const csvLines = [
      headers.join(','),
      ...csvRows.map(row => [
        escapeCsvField(row.id),
        escapeCsvField(row.title),
        escapeCsvField(row.description),
        escapeCsvField(row.speakers),
        escapeCsvField(row.categories),
        escapeCsvField(row.questionAnswers),
        escapeCsvField(row.speaker_ids),
        escapeCsvField(row.speaker_names),
        escapeCsvField(row.speaker_taglines),
        escapeCsvField(row.speaker_bios),
        escapeCsvField(row.speaker_profile_pictures),
        escapeCsvField(row.speaker_links),
        escapeCsvField(row.status),
        row.title_score?.toString() || '',
        escapeCsvField(row.title_justification || ''),
        row.description_score?.toString() || '',
        escapeCsvField(row.description_justification || ''),
        row.key_takeaways_score?.toString() || '',
        escapeCsvField(row.key_takeaways_justification || ''),
        row.given_before_score?.toString() || '',
        escapeCsvField(row.given_before_justification || ''),
        row.evaluation_score_total?.toString() || '',
        escapeCsvField(row.created_at),
        escapeCsvField(row.completed_at || '')
      ].join(','))
    ];
    
    const csvContent = csvLines.join('\n');
    
    // Write to CSV file
    const exportPath = path.join(process.cwd(), 'sessions-export.csv');
    await fs.writeFile(exportPath, csvContent, 'utf-8');
    
    console.log(`✅ Database exported to CSV: ${exportPath}`);
    console.log(`📊 Export Summary:`);
    console.log(`   Total sessions: ${csvRows.length}`);
    console.log(`   Sessions with evaluations: ${csvRows.filter(row => row.status === 'ready').length}`);
    console.log(`   Sessions without evaluations: ${csvRows.filter(row => row.status === 'new').length}`);
    console.log(`   Sessions with speaker info: ${csvRows.filter(row => row.speaker_names !== '').length}`);
    console.log(`   CSV fields: ${headers.length}`);
    
  } catch (error) {
    console.error('❌ Error exporting database to CSV:', error);
    process.exit(1);
  } finally {
    await dbService.close();
  }
}

// Run the export function
exportDatabaseCsv(); 