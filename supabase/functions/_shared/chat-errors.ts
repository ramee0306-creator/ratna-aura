// Turning failures in a chat function into friendly answers for the app.
import Anthropic from 'npm:@anthropic-ai/sdk@0.131.0';

import { ChatInputError } from './chat.ts';
import { AiNotConfigured, AiRefused } from './claude.ts';
import { errorResponse } from './http.ts';

export function chatErrorResponse(err: unknown, what: string): Response {
  if (err instanceof ChatInputError) return errorResponse(err.status, err.message);
  if (err instanceof AiNotConfigured) return errorResponse(503, 'AI chat is not switched on yet');
  if (err instanceof AiRefused) return errorResponse(422, 'The AI could not answer this message. You were not charged.');
  if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) {
    return errorResponse(429, 'The AI is busy. Please try again in a minute. You were not charged.');
  }
  console.error(`${what} failed`, err instanceof Error ? err.message : err);
  return errorResponse(500, 'Something went wrong. Please try again. You were not charged.');
}
