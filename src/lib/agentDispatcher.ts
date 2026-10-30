import { getProjectState } from './projectState';
import { classifyIntent } from './agentIntent';
import { generateAgentResponse } from './agentReasoner';

export function dispatchAgentQuestion(
  question: string,
  context?: any
): string {
  const state = getProjectState();
  const intent = classifyIntent(question);
  return generateAgentResponse(intent, state, context);
}
