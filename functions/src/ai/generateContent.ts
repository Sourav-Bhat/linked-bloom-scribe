import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { generateText } from '../utils/geminiClient';
import { baseHttpsOptions } from '../utils/httpsOptions';

const handler = async (req: Request, res: Response): Promise<void> => {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  await new Promise<void>((resolve, reject) =>
    verifyToken(req, res, (err?: any) => (err ? reject(err) : resolve()))
  );
  if (res.headersSent) return;

  const uid: string = (req as any).uid;
  const { topic, tone, instructions, includeHashtags, postLength, regeneratePrompt, previousContent, model } = req.body;

  // Load persona context (rich persona lives under `personaData`)
  let personaContext = '';
  try {
    const snap = await admin.firestore().doc(`users/${uid}/persona/main`).get();
    if (snap.exists) {
      const d = snap.data()!;
      const p = d.personaData || {};
      const parts: string[] = [];
      if (p.archetype?.name) parts.push(`The author's brand archetype is "${p.archetype.name}" — ${p.archetype.tagline || ''}.`);
      if (Array.isArray(p.contentPillars) && p.contentPillars.length) {
        parts.push(`Their content pillars are: ${p.contentPillars.map((c: any) => c.title).filter(Boolean).join('; ')}.`);
      }
      if (p.voiceProfile?.tone) parts.push(`Their voice/tone: ${p.voiceProfile.tone}.`);
      if (p.voiceProfile?.signatureStyle) parts.push(`Their signature style: ${p.voiceProfile.signatureStyle}.`);
      if (p.voiceProfile?.thingsToAvoid) parts.push(`STRICTLY AVOID: ${p.voiceProfile.thingsToAvoid}.`);
      // Fallbacks for older/simpler profiles
      if (!parts.length && (d.industry || d.tone || d.topics)) {
        parts.push(`User persona: industry=${d.industry}, tone=${d.tone}, topics=${(d.topics || []).join(', ')}.`);
      }
      if (parts.length) personaContext = `Write in the author's established voice. ${parts.join(' ')}`;
    }
  } catch { /* persona optional */ }

  // Word bands MUST match the UI labels (Short 50-100 / Medium 100-200 / Long 200-300).
  const lengthGuide = postLength === 'short' ? '50-100 words'
    : postLength === 'long' ? '200-300 words'
    : '100-200 words';

  const systemPrompt = [
    'You are an expert LinkedIn ghostwriter.',
    personaContext,
    `Write a ${tone} LinkedIn post about: ${topic}.`,
    `STRICT LENGTH: the post body must be ${lengthGuide}. Do not exceed the upper bound — count words and trim if needed.`,
    'FORMAT: write plain text ready to paste directly into LinkedIn. Do NOT use markdown — no **, no ##, no backticks, no markdown bullets. Use short paragraphs and line breaks for readability; if you list items use "•".',
    instructions ? `Additional instructions: ${instructions}.` : '',
    includeHashtags ? 'After the body, add 3-5 relevant hashtags in the hashtags field only.' : 'Do not include hashtags.',
    previousContent ? `Previous version to improve:\n${previousContent}\nImprovement request: ${regeneratePrompt || 'improve it'}` : '',
    'Return ONLY valid JSON: { "title": "...", "content": "...", "hashtags": "..." }. The content field is the post body without the title or hashtags.',
  ].filter(Boolean).join(' ');

  let text: string;
  try {
    text = await generateText(systemPrompt, 'Generate content as instructed.', model, {
      name: 'generateContent',
      userId: uid,
      tags: tone ? [`tone:${tone}`] : [],
      metadata: { topic, tone, postLength, regenerate: Boolean(previousContent) },
    });
  } catch (err: any) {
    res.status(502).json({ error: `Gemini error: ${err.message || err}` });
    return;
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch![0]);
    res.json(parsed);
  } catch {
    res.json({ title: topic, content: text, hashtags: '' });
  }
};

export const generateContent = onRequest(baseHttpsOptions, handler as any);
