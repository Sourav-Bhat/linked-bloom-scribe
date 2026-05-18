import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { LOVABLE_API_KEY, callLovableGateway } from '../utils/geminiClient';

const handler = async (req: Request, res: Response): Promise<void> => {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  await new Promise<void>((resolve, reject) =>
    verifyToken(req, res, (err?: any) => (err ? reject(err) : resolve()))
  );
  if (res.headersSent) return;

  const uid: string = (req as any).uid;
  const { messages } = req.body as { messages: Array<{ role: string; content: string }> };

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

  const apiKey = LOVABLE_API_KEY.value();
  const gatewayRes = await callLovableGateway(apiKey, messages, systemPrompt, true);

  if (!gatewayRes.ok) {
    const err = await gatewayRes.text();
    res.status(502).json({ error: `AI gateway error: ${err}` });
    return;
  }

  // Stream SSE response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const reader = (gatewayRes.body as any).getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    res.write(chunk);
  }

  res.write('data: [DONE]\n\n');
  res.end();
};

export const prAgentChat = onRequest(
  { secrets: [LOVABLE_API_KEY], cors: true, timeoutSeconds: 300 },
  handler as any,
);
