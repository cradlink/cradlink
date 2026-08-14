import type { NotificationsRepo } from "@/lib/data/types";
import type { AppNotification } from "@/lib/types";

const KEY = "cl_notifications";

function load(): Record<string, AppNotification> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, AppNotification>;
  } catch {
    return {};
  }
}

function save(rows: Record<string, AppNotification>) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export const localNotifications: NotificationsRepo = {
  async list(userId) {
    return Object.values(load())
      .filter((row) => row.recipientId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async ensure(notification) {
    const rows = load();
    if (rows[notification.id]) return { created: false, notification: rows[notification.id] };
    rows[notification.id] = { ...notification, read: false };
    save(rows);
    return { created: true, notification: rows[notification.id] };
  },

  async markRead(id, userId) {
    const rows = load();
    if (!rows[id] || rows[id].recipientId !== userId) return;
    rows[id] = { ...rows[id], read: true };
    save(rows);
  },

  async markAllRead(userId) {
    const rows = load();
    for (const row of Object.values(rows)) {
      if (row.recipientId === userId) rows[row.id] = { ...row, read: true };
    }
    save(rows);
  },

  async remove(id, userId) {
    const rows = load();
    if (!rows[id]) return;
    if (rows[id].recipientId !== userId && rows[id].actorId !== userId) return;
    delete rows[id];
    save(rows);
  },
};
