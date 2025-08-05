# SessionizeService

A standalone service class for fetching session data from Sessionize API endpoints.

## Installation

This service is designed to be used in any Node.js project. Simply copy the `index.ts` file to your project.

## Usage

### Basic Usage

```typescript
import { SessionizeService } from './sessionize';

// Create a new service instance with your sessions URL
const sessionizeService = new SessionizeService('http://localhost:3001/sessions');

// Fetch all sessions
const result = await sessionizeService.fetchSessions();

console.log(`Found ${result.totalSessions} sessions`);
console.log(`Across ${result.groups.length} groups`);

// Access the sessions
result.sessions.forEach(session => {
  console.log(`- ${session.title} by ${session.speakers[0]?.name}`);
});
```

### API Reference

#### Constructor

```typescript
new SessionizeService(sessionsUrl: string)
```

- `sessionsUrl`: The URL endpoint for fetching sessions data

#### Methods

##### `fetchSessions(): Promise<FetchSessionsResult>`

Fetches all sessions from the configured URL.

**Returns:**
```typescript
interface FetchSessionsResult {
  sessions: Session[];           // All sessions flattened from all groups
  totalSessions: number;         // Total count of sessions
  groups: {                      // Summary of groups
    groupId: string | null;
    groupName: string;
    sessionCount: number;
  }[];
}
```

##### `getSessionsUrl(): string`

Returns the current sessions URL.

##### `setSessionsUrl(url: string): void`

Updates the sessions URL.

### Data Types

#### Session

```typescript
interface Session {
  questionAnswers: QuestionAnswer[];
  id: string;
  title: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
  isServiceSession: boolean;
  isPlenumSession: boolean;
  speakers: Speaker[];
  categories: Category[];
  roomId: string | null;
  room: string | null;
  liveUrl: string | null;
  recordingUrl: string | null;
  status: string;
  isInformed: boolean;
  isConfirmed: boolean;
}
```

#### Speaker

```typescript
interface Speaker {
  id: string;
  name: string;
}
```

#### Category

```typescript
interface Category {
  id: number;
  name: string;
  categoryItems: CategoryItem[];
  sort: number;
}
```

### Error Handling

The service throws descriptive errors when:

- The HTTP request fails
- The response is not OK (non-200 status)
- JSON parsing fails
- Network errors occur

```typescript
try {
  const result = await sessionizeService.fetchSessions();
  // Handle success
} catch (error) {
  console.error('Failed to fetch sessions:', error.message);
}
```

### Examples

See `example.ts` for complete usage examples including:

- Basic session fetching
- Custom URL configuration
- URL management
- Error handling

## Integration with Mastra

This service can be easily integrated with Mastra tools by importing the service and using it within the tool's execute function. 