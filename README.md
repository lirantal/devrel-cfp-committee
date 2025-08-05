# DevRel CFP Committee Processing System

A Node.js application that processes Call for Papers (CFP) session submissions using AI agents to evaluate and score proposals. The system uses Mastra workflows and fastq for efficient queue-based processing.

## 🎯 Purpose

This project serves as a single-purpose entry point for processing CFP sessions. It:

- Loads session data from a JSON file
- Processes each session through an AI evaluation workflow
- Provides structured scoring and justification for each session
- Saves the complete evaluation results to a JSON file

## 🏗️ Architecture

### Core Components

1. **Main Entry Point** (`src/app.ts`)
   - Uses `fastq` to manage a queue of sessions
   - Processes sessions concurrently (2 at a time)
   - Loads session data from `__fixtures__/db.json`
   - Saves results to `processed-sessions.json`

2. **CFP Evaluation Agent** (`src/mastra/agents/cfp-evaluation-agent.ts`)
   - Evaluates session proposals based on multiple criteria
   - Returns structured scores (1-5) with justifications
   - Currently uses mock data (can be replaced with real AI model)

3. **CFP Evaluation Workflow** (`src/mastra/workflows/cfp-evaluation-workflow.ts`)
   - Orchestrates the evaluation process
   - Processes session data through the evaluation agent
   - Returns structured evaluation results

### Data Flow

```
Session Data (JSON) → Queue (fastq) → Workflow → Agent → Evaluation Results
```

## 📊 Evaluation Criteria

Each session is evaluated on the following criteria (1-5 scale):

- **Title**: Clarity, engagement, and descriptiveness
- **Description**: How well it explains content, value, and target audience
- **Key Takeaways**: Value and actionability of provided takeaways
- **Overall Quality**: Overall assessment of proposal quality and completeness
- **Relevance**: Relevance to conference theme and target audience
- **Technical Depth**: Technical sophistication and depth of content

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.9.0
- npm or pnpm

### Installation

```bash
npm install
```

### Running the Application

```bash
npm run process-cfp
```

This will:
1. Load session data from `__fixtures__/db.json`
2. Process all sessions through the evaluation workflow
3. Save results to `processed-sessions.json`
4. Display a summary of processing results

### Development

Start the Mastra development server:

```bash
npm run dev
```

This starts the Mastra playground at `http://localhost:4111` where you can test workflows interactively.

## 📁 Project Structure

```
devrel-cfp-committee/
├── __fixtures__/
│   └── db.json                 # Sample session data
├── src/
│   ├── app.ts                  # Main entry point
│   ├── mastra/
│   │   ├── agents/
│   │   │   └── cfp-evaluation-agent.ts
│   │   ├── workflows/
│   │   │   └── cfp-evaluation-workflow.ts
│   │   └── index.ts           # Mastra configuration
│   └── services/
│       └── sessionize/        # Sessionize API integration
├── package.json
└── README.md
```

## 🔧 Configuration

### API Keys

To use real AI evaluation (instead of mock data), set up API keys:

```bash
export GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

Then uncomment the agent.generate() code in the workflow and comment out the mock evaluation.

### Queue Configuration

The application processes 2 sessions concurrently by default. You can modify this in `src/app.ts`:

```typescript
const queue = fastq.promise(processSession, 2); // Change 2 to desired concurrency
```

## 📈 Output

The application generates:

1. **Console Output**: Real-time processing status and summary
2. **processed-sessions.json**: Complete evaluation results including:
   - Original session data
   - AI evaluation scores and justifications
   - Processing timestamp

### Sample Output

```json
{
  "sessionData": { /* original session data */ },
  "evaluation": {
    "title": {
      "score": 4,
      "justification": "Title is clear and descriptive for an React Native conference"
    },
    "description": {
      "score": 5,
      "justification": "Description provides good technical depth and clear value proposition"
    },
    // ... other criteria
  },
  "processedAt": "2025-08-05T08:55:05.133Z"
}
```

## 🔄 Workflow Integration

The system integrates with Mastra's workflow system:

- **Workflows**: Define the evaluation process
- **Agents**: Handle AI-powered evaluation
- **Steps**: Individual processing units
- **Storage**: Persists workflow state and results

## 🛠️ Customization

### Adding New Evaluation Criteria

1. Update the agent's output schema in `cfp-evaluation-agent.ts`
2. Modify the workflow's evaluation logic in `cfp-evaluation-workflow.ts`
3. Update the mock evaluation data structure

### Changing Data Sources

Modify the `loadSessions()` function in `src/app.ts` to load from different sources (API, database, etc.).

### Adjusting Processing Logic

The `processSession()` function in `src/app.ts` handles individual session processing. Modify this to add custom logic, error handling, or different output formats.

## 📝 Scripts

- `npm run process-cfp`: Process all sessions
- `npm run dev`: Start Mastra development server
- `npm run build`: Build Mastra workflows
- `npm run start`: Start Mastra server
- `npm run db`: Start JSON server for development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run process-cfp`
5. Submit a pull request

## 📄 License

ISC License - see package.json for details. 