import { Langfuse } from 'langfuse';

// Optional Langfuse observability. Reads config from process.env so it works
// uniformly across environments without coupling to Firebase Secret Manager:
//   - local emulator -> functions/.env.local (dev Langfuse project keys)
//   - production      -> functions/.env written by CI from GitHub secrets
// If keys are absent, every helper here is a no-op — tracing never breaks a
// request or a deploy.
const SECRET_KEY = process.env.LANGFUSE_SECRET_KEY;
const PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY;
const BASE_URL = process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com';

// The Functions emulator sets FUNCTIONS_EMULATOR=true; use it to tag traces so
// local and production traffic are trivially separable in Langfuse.
export const RUNTIME_ENV =
  process.env.FUNCTIONS_EMULATOR === 'true' ? 'local' : 'production';

const client: Langfuse | null =
  SECRET_KEY && PUBLIC_KEY
    ? new Langfuse({ secretKey: SECRET_KEY, publicKey: PUBLIC_KEY, baseUrl: BASE_URL })
    : null;

export const langfuseEnabled = client !== null;

type GeminiUsage = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

export interface GenerationContext {
  /** Logical operation name, e.g. the function name. */
  name: string;
  /** Firebase uid of the caller, if known. */
  userId?: string;
  model: string;
  input: unknown;
  /** Extra tags appended to the standard set. */
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface GenerationHandle {
  end: (result: {
    output?: unknown;
    usage?: GeminiUsage;
    level?: 'DEFAULT' | 'ERROR';
    statusMessage?: string;
  }) => void;
}

/**
 * Start a Langfuse trace + generation for one LLM call. Returns null when
 * tracing is disabled. Always pair with flushLangfuse() before the function
 * returns (serverless batches and would otherwise drop the events).
 */
export function startGeneration(ctx: GenerationContext): GenerationHandle | null {
  if (!client) return null;

  const tags = [
    'linkedbloom',
    `env:${RUNTIME_ENV}`,
    `fn:${ctx.name}`,
    `model:${ctx.model}`,
    ...(ctx.tags ?? []),
  ];

  try {
    const trace = client.trace({
      name: ctx.name,
      userId: ctx.userId,
      tags,
      input: ctx.input,
      metadata: ctx.metadata,
    });
    const generation = trace.generation({
      name: ctx.name,
      model: ctx.model,
      input: ctx.input,
      metadata: ctx.metadata,
    });

    return {
      end: ({ output, usage, level, statusMessage }) => {
        try {
          generation.end({
            output,
            ...(level ? { level } : {}),
            ...(statusMessage ? { statusMessage } : {}),
            ...(usage
              ? {
                  usage: {
                    input: usage.promptTokenCount,
                    output: usage.candidatesTokenCount,
                    total: usage.totalTokenCount,
                    unit: 'TOKENS',
                  },
                }
              : {}),
          });
          trace.update({ output });
        } catch {
          /* never let tracing break the request */
        }
      },
    };
  } catch {
    return null;
  }
}

export async function flushLangfuse(): Promise<void> {
  if (!client) return;
  try {
    await client.flushAsync();
  } catch {
    /* ignore flush errors */
  }
}
