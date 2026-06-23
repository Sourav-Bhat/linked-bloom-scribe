import { GoogleGenAI } from '@google/genai';
import { startGeneration, flushLangfuse } from './langfuse';

// Optional per-call observability context (caller identity + tags/metadata for
// Langfuse). Tracing is a no-op when Langfuse isn't configured.
export interface TraceContext {
  name: string;
  userId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

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
  ctx?: TraceContext,
): Promise<string> => {
  const resolved = resolveModel(model);
  const gen = startGeneration({
    name: ctx?.name ?? 'generateText',
    userId: ctx?.userId,
    model: resolved,
    input: { systemPrompt, userMessage },
    tags: ctx?.tags,
    metadata: ctx?.metadata,
  });
  try {
    const result = await ai.models.generateContent({
      model: resolved,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: { systemInstruction: systemPrompt },
    });
    const text = result.text ?? '';
    gen?.end({ output: text, usage: (result as any).usageMetadata });
    return text;
  } catch (err: any) {
    gen?.end({ output: err?.message ?? String(err), level: 'ERROR', statusMessage: 'gemini error' });
    throw err;
  } finally {
    await flushLangfuse();
  }
};

export const streamChat = async (
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  model?: string,
  ctx?: TraceContext,
): Promise<AsyncIterable<{ text?: string }>> => {
  const resolved = resolveModel(model);
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const gen = startGeneration({
    name: ctx?.name ?? 'streamChat',
    userId: ctx?.userId,
    model: resolved,
    input: messages,
    tags: [...(ctx?.tags ?? []), 'streaming'],
    metadata: ctx?.metadata,
  });

  const stream = await ai.models.generateContentStream({
    model: resolved,
    contents,
    config: { systemInstruction: systemPrompt },
  });

  // Wrap the stream so we can record the assembled output + token usage once it
  // finishes, without changing how the caller consumes it.
  return (async function* () {
    let assembled = '';
    let usage: any;
    try {
      for await (const chunk of stream) {
        if (chunk.text) assembled += chunk.text;
        if ((chunk as any).usageMetadata) usage = (chunk as any).usageMetadata;
        yield chunk;
      }
      gen?.end({ output: assembled, usage });
    } catch (err: any) {
      gen?.end({ output: err?.message ?? String(err), level: 'ERROR', statusMessage: 'gemini stream error' });
      throw err;
    } finally {
      await flushLangfuse();
    }
  })();
};
