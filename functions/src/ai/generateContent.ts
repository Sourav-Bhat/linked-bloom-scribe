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

  // Load persona context
  let personaContext = '';
  try {
    const snap = await admin.firestore().doc(`users/${uid}/persona/main`).get();
    if (snap.exists) {
      const d = snap.data()!;
      personaContext = `User persona: industry=${d.industry}, tone=${d.tone}, topics=${(d.topics || []).join(', ')}.`;
    }
  } catch { /* persona optional */ }

  const lengthGuide = postLength === 'short' ? '150-300 words' : postLength === 'long' ? '600-900 words' : '300-500 words';

  const systemPrompt = [
    'You are an expert LinkedIn content creator.',
    personaContext,
    `Write a ${tone} LinkedIn post about: ${topic}.`,
    `Target length: ${lengthGuide}.`,
    instructions ? `Additional instructions: ${instructions}.` : '',
    includeHashtags ? 'End with 3-5 relevant hashtags.' : 'Do not include hashtags.',
    previousContent ? `Previous version to improve:\n${previousContent}\nImprovement request: ${regeneratePrompt || 'improve it'}` : '',
    'Return valid JSON: { "title": "...", "content": "...", "hashtags": "..." }',
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
