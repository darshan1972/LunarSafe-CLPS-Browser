import { ProcessedAnalysisResult } from '../types';
import { dispatchAgentQuestion } from './agentDispatcher';

export interface AgentContext {
  selectedSample?: string | null;
  analysis?: ProcessedAnalysisResult | null;
  currentView?: 'ANALYZER' | 'GALLERY' | 'DOSSIER' | 'CLPS_BROWSER';
  nasaStatus?: any;
  isroStatus?: any;
}

export interface AgentResponse {
  reply: string;
  suggestedQuestions: string[];
  sources?: {
    title: string;
    organization: string;
    citation: string;
    url?: string;
  }[];
  liveDataAction?: 'FETCHED_NASA_PDS' | 'ACCESSED_ISRO_CATALOG' | 'NONE';
  liveDataPayload?: any;
}

/**
 * Agent OM: Autonomous Planetary Science & Lunar Mission Co-Pilot
 * Grounded in authentic ISRO & NASA science, official mission specifications,
 * and complete technical documentation of the LunarSafe deterministic pipeline.
 */
export class AgentOmEngine {
  /**
   * Main entry point to ask Agent OM a question
   */
  public static async query(
    userMessage: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    const reply = dispatchAgentQuestion(userMessage, context);
    return {
      reply,
      suggestedQuestions: [
        'What was the result of the last scan?',
        'Which components are currently online?',
        'What is the current cryptographic hash chain?',
        'Is the landing site safe to land?',
      ],
      sources: [
        {
          title: 'LunarSafe Mission Software Telemetry',
          organization: 'AEROX Space Research / LunarSafe Mission OS',
          citation: 'Internal System State & Verification Ledger (2026)',
        },
      ],
    };
  }
}
