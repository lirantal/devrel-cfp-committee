
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { cfpEvaluationWorkflow } from './workflows/cfp-evaluation-workflow';
import { weatherAgent } from './agents/weather-agent';
import { sessionsAgent } from './agents/sessions-agent';
import { cfpEvaluationAgent } from './agents/cfp-evaluation-agent';

export const mastra = new Mastra({
  workflows: { weatherWorkflow, cfpEvaluationWorkflow },
  agents: { weatherAgent, sessionsAgent, cfpEvaluationAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
