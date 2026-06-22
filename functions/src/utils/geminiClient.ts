import { GoogleGenAI } from '@google/genai';

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = 'us-central1';

// Allowlist of Gemini models callers may request. Keep this in sync with
// what's actually available in Vertex AI for LOCATION above.
export const SUPPORTED_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash-001',
] as const;

export type GeminiModel = (typeof SUPPORTED_MODELS)[number];

export const DEFAULT_MODEL: GeminiModel = 'gemini-2.5-flash';

const resolveModel = (requested?: string): GeminiModel =>
  (SUPPORTED_MODELS as readonly string[]).includes(requested ?? '')
    ? (requested as GeminiModel)
    : DEFAULT_MODEL;

const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });

export const generateText = async (
  systemPrompt: string,
  userMessage: string,
  model?: string,
): Promise<string> => {
  const result = await ai.models.generateContent({
    model: resolveModel(model),
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    config: { systemInstruction: systemPrompt },
  });
  return result.text ?? '';
};

export const streamChat = async (
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  model?: string,
): Promise<AsyncIterable<{ text?: string }>> => {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  return ai.models.generateContentStream({
    model: resolveModel(model),
    contents,
    config: { systemInstruction: systemPrompt },
  });
};
