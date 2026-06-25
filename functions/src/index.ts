import * as admin from 'firebase-admin';

admin.initializeApp();

export { generateContent } from './ai/generateContent';
export { personaAgent } from './ai/personaAgent';
export { prAgentChat } from './ai/prAgentChat';
export { setUserAccess } from './admin/manageAccess';
export { onUserSignup } from './admin/onSignup';
