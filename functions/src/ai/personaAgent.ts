import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { generateText } from '../utils/geminiClient';

const handler = async (req: Request, res: Response): Promise<void> => {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  await new Promise<void>((resolve, reject) =>
    verifyToken(req, res, (err?: any) => (err ? reject(err) : resolve()))
  );
  if (res.headersSent) return;

  const uid: string = (req as any).uid;
  const { onboardingData, model } = req.body;

  const systemPrompt = `You are a LinkedIn personal branding expert.
Based on this professional profile, generate a comprehensive LinkedIn persona strategy.

Profile: ${JSON.stringify(onboardingData, null, 2)}

Return valid JSON with this exact structure:
{
  "archetype": { "name": "...", "tagline": "...", "description": "..." },
  "contentPillars": [
    { "title": "...", "rationale": "...", "firstPostIdea": "..." },
    { "title": "...", "rationale": "...", "firstPostIdea": "..." },
    { "title": "...", "rationale": "...", "firstPostIdea": "..." }
  ],
  "postingRhythm": {
    "postsPerWeek": 2,
    "days": ["Tuesday", "Thursday"],
    "bestTimeOfDay": "8-9am",
    "reasoning": "..."
  },
  "voiceProfile": {
    "tone": "...",
    "signatureStyle": "...",
    "thingsToAvoid": "..."
  }
}`;

  let text: string;
  try {
    text = await generateText(systemPrompt, 'Generate my LinkedIn persona strategy.', model);
  } catch (err: any) {
    res.status(502).json({ error: `Gemini error: ${err.message || err}` });
    return;
  }

  let persona: any;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    persona = JSON.parse(jsonMatch![0]);
  } catch {
    res.status(500).json({ error: 'Failed to parse persona response' });
    return;
  }

  // Persist to Firestore
  try {
    const db = admin.firestore();
    await db.doc(`users/${uid}/persona/main`).set(
      { ...onboardingData, personaData: persona, updatedAt: new Date().toISOString() },
      { merge: true },
    );
    await db.doc(`users/${uid}`).set(
      { onboardingCompleted: true, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  } catch (err) {
    console.error('Firestore write error:', err);
  }

  res.json({ persona });
};

export const personaAgent = onRequest(
  { cors: true, serviceAccount: 'firebase-adminsdk-fbsvc@contentmanager-ed707.iam.gserviceaccount.com' },
  handler as any,
);
