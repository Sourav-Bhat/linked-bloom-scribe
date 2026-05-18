import { defineSecret } from 'firebase-functions/params';

export const LOVABLE_API_KEY = defineSecret('LOVABLE_API_KEY');

export const callLovableGateway = async (
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string,
  stream = false,
): Promise<Response> => {
  const body: Record<string, unknown> = {
    model: 'gemini-2.0-flash',
    messages: systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages,
    stream,
  };

  return fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
};
