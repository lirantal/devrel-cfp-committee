# Database Service

This service provides SQLite database functionality for persisting CFP session data and evaluation results.

## Features

- **Session Persistence**: Store session data from JSON files in SQLite database
- **Status Tracking**: Track processing status ('new' vs 'ready') for each session
- **Evaluation Results**: Store evaluation results with individual score fields
- **Resume Capability**: Can resume processing from where it left off
- **Statistics**: Get processing statistics and summaries

## Database Schema

### Sessions Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key, session ID |
| `title` | TEXT | Session title |
| `session_data` | TEXT | JSON stringified session data |
| `status` | TEXT | Processing status ('new' or 'ready') |
| `evaluation_results` | TEXT | JSON stringified evaluation results |
| `title_score` | INTEGER | Title evaluation score (1-5) |
| `title_justification` | TEXT | Title evaluation justification |
| `description_score` | INTEGER | Description evaluation score (1-5) |
| `description_justification` | TEXT | Description evaluation justification |
| `key_takeaways_score` | INTEGER | Key takeaways evaluation score (1-5) |
| `key_takeaways_justification` | TEXT | Key takeaways evaluation justification |
| `given_before_score` | INTEGER | Given before evaluation score (1-5) |
| `given_before_justification` | TEXT | Given before evaluation justification |
| `created_at` | TEXT | ISO timestamp when session was created |
| `completed_at` | TEXT | ISO timestamp when processing completed |

## Usage

### Initialize and Seed Database

```bash
npm run db:seed
```

This will:
1. Create the SQLite database file (`sessions.db`)
2. Create the sessions table
3. Load session data from `__fixtures__/db.json`
4. Display database statistics

### Process Sessions

```bash
npm run process-cfp
```

This will:
1. Initialize the database connection
2. Find all unprocessed sessions (status = 'new')
3. Process each session through the CFP evaluation workflow
4. Update session status to 'ready' when complete
5. Store evaluation results in the database

## API Methods

### DatabaseService

- `initialize()`: Initialize database and create tables
- `seedFromJson(jsonPath)`: Load sessions from JSON file
- `getUnprocessedSessions()`: Get all sessions with status 'new'
- `getProcessedSessions()`: Get all sessions with status 'ready'
- `updateSessionEvaluation(sessionId, evaluation)`: Update session with evaluation results
- `getSessionStats()`: Get processing statistics
- `close()`: Close database connection

## Benefits

1. **Persistence**: Data survives application restarts
2. **Resume Capability**: Can continue processing from interruptions
3. **Rate Limit Handling**: Can pause and resume when hitting API limits
4. **Detailed Tracking**: Individual score fields for easy querying
5. **Status Management**: Clear status tracking for each session
6. **Statistics**: Built-in statistics and reporting

## File Structure

```
src/services/database/
├── index.ts          # Main database service
└── README.md         # This documentation
``` 