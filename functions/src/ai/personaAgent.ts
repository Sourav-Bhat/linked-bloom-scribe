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
  const { onboardingData } = req.body;

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

  const apiKey = LOVABLE_API_KEY.value();
  const gatewayRes = await callLovableGateway(
    apiKey,
    [{ role: 'user', content: 'Generate my LinkedIn persona strategy.' }],
    systemPrompt,
  );

  if (!gatewayRes.ok) {
    const err = await gatewayRes.text();
    res.status(502).json({ error: `AI gateway error: ${err}` });
    return;
  }

  const data = await gatewayRes.json() as any;
  const text: string = data.choices?.[0]?.message?.content || '';

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
  { secrets: [LOVABLE_API_KEY], cors: true },
  handler as any,
);
