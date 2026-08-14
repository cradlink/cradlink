import { firebaseAuth } from "@/lib/auth/firebase";
import { localAuth } from "@/lib/auth/local";
import type { AuthRepo } from "@/lib/auth/types";
import { firebaseComments } from "@/lib/data/comments-firebase";
import { localComments } from "@/lib/data/comments-local";
import { firebaseActivities, firebaseMembers, firebaseUsers } from "@/lib/data/firebase";
import { localActivities, localMembers, localUsers } from "@/lib/data/local";
import { firebaseNotifications } from "@/lib/data/notifications-firebase";
import { localNotifications } from "@/lib/data/notifications-local";
import type {
  ActivitiesRepo,
  CommentsRepo,
  MembersRepo,
  NotificationsRepo,
  StorageRepo,
  UsersRepo,
} from "@/lib/data/types";
import { getBackendName } from "@/lib/config";
import { isFirebaseConfigured } from "@/lib/firebase";
import { firebaseStorageRepo } from "@/lib/storage/firebase";
import { localStorageRepo } from "@/lib/storage/local";

export type Backend = {
  name: "local" | "firebase";
  auth: AuthRepo;
  users: UsersRepo;
  activities: ActivitiesRepo;
  members: MembersRepo;
  storage: StorageRepo;
  notifications: NotificationsRepo;
  comments: CommentsRepo;
};

export function getBackend(): Backend {
  if (getBackendName() === "firebase") {
    if (!isFirebaseConfigured()) {
      throw new Error(
        "VITE_BACKEND=firebase but Firebase env vars are missing. Add them to .env.local or switch back to local.",
      );
    }
    return {
      name: "firebase",
      auth: firebaseAuth,
      users: firebaseUsers,
      activities: firebaseActivities,
      members: firebaseMembers,
      storage: firebaseStorageRepo,
      notifications: firebaseNotifications,
      comments: firebaseComments,
    };
  }

  return {
    name: "local",
    auth: localAuth,
    users: localUsers,
    activities: localActivities,
    members: localMembers,
    storage: localStorageRepo,
    notifications: localNotifications,
    comments: localComments,
  };
}
