import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import type { NotificationsRepo } from "@/lib/data/types";
import { getFirebaseDb } from "@/lib/firebase";
import type { AppNotification } from "@/lib/types";
import { stripUndefined } from "@/lib/utils";

function mapNotification(id: string, data: Record<string, unknown>): AppNotification {
  return {
    id,
    recipientId: String(data.recipientId ?? ""),
    kind: data.kind as AppNotification["kind"],
    activityId: String(data.activityId ?? ""),
    activityTitle: String(data.activityTitle ?? ""),
    actorId: data.actorId ? String(data.actorId) : undefined,
    actorName: data.actorName ? String(data.actorName) : undefined,
    actorAvatar: (data.actorAvatar as string | null | undefined) ?? null,
    createdAt: String(data.createdAt ?? ""),
    read: Boolean(data.read),
  };
}

export const firebaseNotifications: NotificationsRepo = {
  async list(userId) {
    const snap = await getDocs(
      query(collection(getFirebaseDb(), "notifications"), where("recipientId", "==", userId)),
    );
    return snap.docs
      .map((row) => mapNotification(row.id, row.data() as Record<string, unknown>))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async ensure(notification) {
    const ref = doc(getFirebaseDb(), "notifications", notification.id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      return { created: false, notification: mapNotification(existing.id, existing.data() as Record<string, unknown>) };
    }
    await setDoc(ref, stripUndefined({ ...notification, read: false }));
    return { created: true, notification };
  },

  async markRead(id, userId) {
    const ref = doc(getFirebaseDb(), "notifications", id);
    const snap = await getDoc(ref);
    if (!snap.exists() || snap.data().recipientId !== userId) return;
    await updateDoc(ref, { read: true });
  },

  async markAllRead(userId) {
    const items = await firebaseNotifications.list(userId);
    await Promise.all(
      items.filter((item) => !item.read).map((item) => updateDoc(doc(getFirebaseDb(), "notifications", item.id), { read: true })),
    );
  },
};
