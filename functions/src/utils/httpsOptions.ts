import type { HttpsOptions } from 'firebase-functions/v2/https';

// Shared options for all HTTPS functions, kept project-portable.
//
// The runtime service account is read from FUNCTIONS_SERVICE_ACCOUNT at deploy
// time. In production CI we pin it to the project's firebase-adminsdk account
// (which already holds the Vertex AI User role). When unset — e.g. the dev
// project — functions fall back to that project's default runtime service
// account, which only needs `roles/aiplatform.user` granted once.
const serviceAccount = process.env.FUNCTIONS_SERVICE_ACCOUNT;

export const baseHttpsOptions: HttpsOptions = {
  cors: true,
  ...(serviceAccount ? { serviceAccount } : {}),
};
