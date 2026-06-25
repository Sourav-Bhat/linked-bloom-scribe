import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
import { verifyToken, rejectIfNotApproved } from '../middleware/verifyToken';
import { streamChat } from '../utils/geminiClient';
import { baseHttpsOptions } from '../utils/httpsOptions';

const handler = async (req: Request, res: Response): Promise<void> => {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  await new Promise<void>((resolve, reject) =>
    verifyToken(req, res, (err?: any) => (err ? reject(err) : resolve()))
  );
  if (res.headersSent) return;
  if (rejectIfNotApproved(req, res)) return;

  const uid: string = (req as any).uid;
  const { messages, model, mode } = req.body as {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    mode?: string;
  };

  // Load rich persona context.
  let personaContext = 'The user has not completed their persona yet — your first job is to draw it out of them.';
  try {
    const snap = await admin.firestore().doc(`users/${uid}/persona/main`).get();
    if (snap.exists) {
      const d = snap.data()!;
      const pd = d.personaData;
      if (pd) {
        const pillars = (pd.contentPillars || [])
          .map((p: any) => `- ${p.title}${p.rationale ? `: ${p.rationale}` : ''}`).join('\n');
        personaContext = [
          `ARCHETYPE: ${pd.archetype?.name || ''} — ${pd.archetype?.tagline || ''}`,
          pd.archetype?.description ? `ABOUT THEM: ${pd.archetype.description}` : '',
          pillars ? `CONTENT PILLARS:\n${pillars}` : '',
          pd.postingRhythm ? `RHYTHM: ${pd.postingRhythm.postsPerWeek}x/week on ${(pd.postingRhythm.days || []).join(', ')}.` : '',
          pd.voiceProfile?.tone ? `VOICE/TONE: ${pd.voiceProfile.tone}` : '',
          pd.voiceProfile?.signatureStyle ? `STYLE: ${pd.voiceProfile.signatureStyle}` : '',
          pd.voiceProfile?.thingsToAvoid ? `AVOID: ${pd.voiceProfile.thingsToAvoid}` : '',
        ].filter(Boolean).join('\n');
      } else if (d.industry || d.tone) {
        personaContext = `Industry: ${d.industry}. Preferred tone: ${d.tone}. Topics: ${(d.topics || []).join(', ')}.`;
      }
    }
  } catch { /* context optional */ }

  const modeDirectives: Record<string, string> = {
    discovery:
      'MODE — DISCOVERY: Run a deep-dive interview to enrich their persona. Ask probing, specific questions about their story, expertise, contrarian opinions, audience, and goals. Target the gaps in what you already know about them. One focused question per turn.',
    brainstorm:
      'MODE — BRAINSTORM: Generate sharp post angles and hooks rooted in their pillars and recent conversation. Offer 2–3 distinct angles, then ask which to develop. When one lands, suggest turning it into a post.',
    strategy:
      'MODE — STRATEGY REVIEW: Audit their direction against their positioning and pillars. Name what is working, what is drifting off-brand, and what to change. Be direct about trade-offs.',
    accountability:
      'MODE — ACCOUNTABILITY: Hold them to their stated cadence and goals. Check what they have/haven’t shipped, surface what’s blocking them, and agree on one concrete next action.',
  };
  const modeDirective = modeDirectives[(mode || '').toLowerCase()] || modeDirectives.discovery;

  const systemPrompt = `You are this person's dedicated personal-brand strategist — the kind of senior operator a top PR agency would assign to a high-value client. This is an ongoing engagement, not a one-off Q&A. You remember the whole conversation above and build on it.

WHO THEY ARE:
${personaContext}

HOW YOU WORK (like a real PR strategist, not a chatbot):
- Lead the engagement. Don't just answer — diagnose, probe, and steer.
- Ask ONE sharp, provoking question at a time. Push past surface-level answers ("That's the safe version — what's the take your peers would actually disagree with?").
- Be a candid sparring partner, never a yes-man. If an idea is generic, off-brand, or weak, say so and explain why.
- Continuously deepen their persona: notice gaps and ask the questions that fill them.
- Watch for drift. If their topic or angle strays from their positioning and pillars, flag it and steer them back — or pressure-test whether their focus is genuinely changing.
- Guide toward action. When a strong angle emerges, explicitly suggest turning it into a LinkedIn post and offer to shape it.
- Keep replies tight and conversational — a few short paragraphs at most. No long essays, no markdown headers, no numbered walls of text.

${modeDirective}`;

  let stream: AsyncIterable<{ text?: string }>;
  try {
    stream = await streamChat(systemPrompt, messages, model, {
      name: 'prAgentChat',
      userId: uid,
      tags: ['chat'],
      metadata: { turns: messages?.length ?? 0 },
    });
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
  { ...baseHttpsOptions, timeoutSeconds: 300 },
  handler as any,
);
