
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { cfpEvaluationWorkflow } from './workflows/cfp-evaluation-workflow';
import { sessionsAgent } from './agents/sessions-agent';
import { cfpEvaluationAgent } from './agents/cfp-evaluation-agent';
import { speakerProfileAssessmentAgent } from './agents/speaker-profile-assessment-agent';

export const mastra = new Mastra({
    workflows: { cfpEvaluationWorkflow },
    agents: { 
      sessionsAgent, 
      cfpEvaluationAgent,
      speakerProfileAssessmentAgent
    },
    storage: new LibSQLStore({
      // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
      url: ":memory:",
    }),
    logger: new PinoLogger({
      name: 'Mastra',
      level: 'info',
    }),
  });