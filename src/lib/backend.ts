import { firebaseAuth } from "@/lib/auth/firebase";
import { localAuth } from "@/lib/auth/local";
import type { AuthRepo } from "@/lib/auth/types";
import { firebaseActivities, firebaseMembers, firebaseUsers } from "@/lib/data/firebase";
import { localActivities, localMembers, localUsers } from "@/lib/data/local";
import type { ActivitiesRepo, MembersRepo, StorageRepo, UsersRepo } from "@/lib/data/types";
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
};

export function getBackend(): Backend {
  if (getBackendName() === "firebase") {
    if (!isFirebaseConfigured()) {
      throw new Error(
        "NEXT_PUBLIC_BACKEND=firebase but Firebase env vars are missing. Add them to .env.local or switch back to local.",
      );
    }
    return {
      name: "firebase",
      auth: firebaseAuth,
      users: firebaseUsers,
      activities: firebaseActivities,
      members: firebaseMembers,
      storage: firebaseStorageRepo,
    };
  }

  return {
    name: "local",
    auth: localAuth,
    users: localUsers,
    activities: localActivities,
    members: localMembers,
    storage: localStorageRepo,
  };
}
