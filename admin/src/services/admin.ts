import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db, FUNCTIONS_BASE_URL } from "@/lib/firebase";

export type AccessStatus = "pending" | "approved" | "rejected" | "unknown";

export interface AdminUser {
  id: string;
  email?: string;
  displayName?: string;
  signUpProvider?: string;
  accessStatus?: AccessStatus;
  onboardingCompleted?: boolean;
  createdAt?: string;
  approvedAt?: string | null;
  lastLoginAt?: string;
}

/** Read the whole users collection (rules allow admins to list/read any user). */
export async function fetchUsers(): Promise<AdminUser[]> {
  let snap;
  try {
    snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  } catch {
    // some legacy docs may lack createdAt — fall back to an unordered read
    snap = await getDocs(collection(db, "users"));
  }
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminUser, "id">) }));
}

/** Approve or reject a user via the admin-only Cloud Function. */
export async function setUserAccess(uid: string, action: "approve" | "reject"): Promise<void> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`${FUNCTIONS_BASE_URL}/setUserAccess`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ uid, action }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
}

export interface UserStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  onboarded: number;
  googleUsers: number;
  last7d: number;
}

export function computeStats(users: AdminUser[]): UserStats {
  const weekAgo = Date.now() - 7 * 864e5;
  return {
    total: users.length,
    pending: users.filter((u) => u.accessStatus === "pending").length,
    approved: users.filter((u) => u.accessStatus === "approved").length,
    rejected: users.filter((u) => u.accessStatus === "rejected").length,
    onboarded: users.filter((u) => u.onboardingCompleted).length,
    googleUsers: users.filter((u) => u.signUpProvider === "google.com").length,
    last7d: users.filter((u) => u.createdAt && new Date(u.createdAt).getTime() >= weekAgo).length,
  };
}

/** Signups grouped by day for the last `days` days (oldest first). */
export function signupsByDay(users: AdminUser[], days = 14): { date: string; signups: number }[] {
  const buckets: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const u of users) {
    if (!u.createdAt) continue;
    const key = new Date(u.createdAt).toISOString().slice(0, 10);
    if (key in buckets) buckets[key] += 1;
  }
  return Object.entries(buckets).map(([date, signups]) => ({
    date: new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    signups,
  }));
}
