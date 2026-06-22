import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { streamChat } from '../utils/geminiClient';

const handler = async (req: Request, res: Response): Promise<void> => {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  await new Promise<void>((resolve, reject) =>
    verifyToken(req, res, (err?: any) => (err ? reject(err) : resolve()))
  );
  if (res.headersSent) return;

  const uid: string = (req as any).uid;
  const { messages, model } = req.body as {
    messages: Array<{ role: string; content: string }>;
    model?: string;
  };

  // Load persona context
  let personaContext = '';
  try {
    const snap = await admin.firestore().doc(`users/${uid}/persona/main`).get();
    if (snap.exists) {
      const d = snap.data()!;
      const pd = d.personaData;
      personaContext = pd
        ? `User archetype: ${pd.archetype?.name}. Voice: ${pd.voiceProfile?.tone}. Topics: ${pd.contentPillars?.map((p: any) => p.title).join(', ')}.`
        : `Industry: ${d.industry}, tone: ${d.tone}.`;
    }
  } catch { /* context optional */ }

  const systemPrompt = `You are a personal PR agent and LinkedIn strategist for this user.
${personaContext}
Help them build their LinkedIn presence. Be specific, actionable, and strategic.
Reference their persona when relevant.`;

  let stream: AsyncIterable<{ text?: string }>;
  try {
    stream = await streamChat(systemPrompt, messages, model);
  } catch (err: any) {
    res.status(502).json({ error: `Gemini error: ${err.message || err}` });
    return;
  }

  // Stream SSE response in the OpenAI delta-chunk shape the frontend already parses
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  for await (const chunk of stream) {
    const content = chunk.text;
    if (content) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
};

export const prAgentChat = onRequest(
  { cors: true, timeoutSeconds: 300, serviceAccount: 'firebase-adminsdk-fbsvc@contentmanager-ed707.iam.gserviceaccount.com' },
  handler as any,
);
