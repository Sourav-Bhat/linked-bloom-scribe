import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, query, orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ContentPost } from '@/lib/types';

export const saveGeneratedContent = async (userId: string, content: Partial<ContentPost>) => {
  const { id, ...rest } = content as any;
  await addDoc(collection(db, 'users', userId, 'posts'), {
    ...rest,
    status: rest.status || 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

export const getUserContents = async (userId: string, status?: string) => {
  const q = query(collection(db, 'users', userId, 'posts'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContentPost));
  return status ? posts.filter((p) => p.status === status) : posts;
};

export const getContent = async (userId: string, postId: string) => {
  const snap = await getDoc(doc(db, 'users', userId, 'posts', postId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ContentPost;
};

export const updateContentStatus = async (
  userId: string,
  postId: string,
  status: ContentPost['status'],
) => {
  await updateDoc(doc(db, 'users', userId, 'posts', postId), {
    status,
    updatedAt: new Date().toISOString(),
  });
};

export const updateContent = async (
  userId: string,
  postId: string,
  data: Partial<ContentPost>,
) => {
  const { id, ...rest } = data as any;
  await updateDoc(doc(db, 'users', userId, 'posts', postId), {
    ...rest,
    updatedAt: new Date().toISOString(),
  });
};

/** Move a post into the `scheduled` state with a concrete publish date/time. */
export const scheduleContent = async (
  userId: string,
  postId: string,
  scheduledDate: string,
) => {
  await updateDoc(doc(db, 'users', userId, 'posts', postId), {
    status: 'scheduled',
    scheduledDate,
    updatedAt: new Date().toISOString(),
  });
};

/** Move a scheduled post back to draft, clearing its scheduled date. */
export const unscheduleContent = async (userId: string, postId: string) => {
  await updateDoc(doc(db, 'users', userId, 'posts', postId), {
    status: 'draft',
    scheduledDate: '',
    updatedAt: new Date().toISOString(),
  });
};
