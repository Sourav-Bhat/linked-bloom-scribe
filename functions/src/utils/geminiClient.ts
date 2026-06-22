import { GoogleGenAI } from '@google/genai';

// Vertex AI is a real cloud API (can't be emulated). When running under the
// local Functions emulator the ambient project is the demo/emulator project,
// so VERTEX_PROJECT lets us point Gemini calls at a real GCP project. In a
// deployed function VERTEX_PROJECT is unset and GCLOUD_PROJECT is the live
// project, so prod behavior is unchanged.
const PROJECT_ID =
  process.env.VERTEX_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT;
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
