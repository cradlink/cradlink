import type { Activity, ActivityMember, ActivityReply, User } from "@/lib/types"

function isoOffset(days: number, hour: number, minute = 0) {
  const next = new Date()
  next.setDate(next.getDate() + days)
  next.setHours(hour, minute, 0, 0)
  return next.toISOString()
}

function bot(
  id: string,
  displayName: string,
  username: string,
  bio: string,
  skills: string[],
  avatarUrl: string,
): User {
  const createdAt = isoOffset(-40, 12)
  return {
    id,
    displayName,
    email: `${username}@local.cradlink`,
    username,
    bio,
    skills,
    avatarUrl,
    bannerUrl: null,
    location: "Belgrade",
    visibility: "public",
    deactivatedAt: null,
    createdAt,
    updatedAt: createdAt,
    emailVerified: true,
  }
}

export const LOCAL_BOTS: User[] = [
  bot(
    "local_mira",
    "Mira Vuk",
    "mira",
    "Propulsion, late roofs, and not talking through T-0.",
    ["Space", "Engineering"],
    "generated:#1d9bf0",
  ),
  bot(
    "local_jules",
    "Jules Okonkwo",
    "jules",
    "Long glass, short nights. I shoot launches like they owe me money.",
    ["Photo", "Space"],
    "generated:#ffd400",
  ),
  bot(
    "local_sofia",
    "Sofia Krstić",
    "sofia",
    "I bring the projector, the extension cord, and the ajvar.",
    ["Community", "Film"],
    "generated:#f91880",
  ),
  bot(
    "local_rex",
    "Rex Tan",
    "rex",
    "First launch. I have questions and a thermos.",
    ["Curious", "Space"],
    "generated:#00ba7c",
  ),
  bot(
    "local_kenji",
    "Kenji Sato",
    "kenji",
    "Orbital mechanics jokes. Scrub protocol: we still eat.",
    ["Physics", "Comedy"],
    "generated:#7856ff",
  ),
]

export const LOCAL_SPACEX_ID = "local_spacex"

export const LOCAL_ACTIVITIES: Activity[] = [
  {
    id: LOCAL_SPACEX_ID,
    title: "SpaceX launch watch — roof, countdown, no spoilers",
    description:
      "Next Falcon 9 west-coast window. Projector on the Dorćol roof, speaker for the NASA/SpaceX loop, snacks that survive a hold.\n\nT-0 is quiet. After the fairing deploy we talk, we replay, we argue about landing burns. If it scrubs we stay for dinner anyway.\n\nBring a layer. The river wind is rude after 22:00.",
    type: "social",
    tags: ["SpaceX", "Launch", "Watch party"],
    lookingFor: ["Space people", "Someone with a spare HDMI", "Night owls"],
    location: { type: "in-person", city: "Belgrade", venue: "Dorćol rooftop, 21:00" },
    startAt: isoOffset(6, 21),
    endAt: isoOffset(6, 23, 30),
    isFlexible: false,
    capacity: 16,
    joinPolicy: "auto",
    headcount: { mode: "estimate", about: 12 },
    creatorId: "local_mira",
    creatorName: "Mira Vuk",
    creatorAvatar: "generated:#1d9bf0",
    memberCount: 6,
    status: "open",
    createdAt: isoOffset(-2, 19, 12),
    updatedAt: isoOffset(-1, 9, 40),
    visibility: "public",
    images: ["spacex", "social-2", "social-3", "seti"],
  },
]

function reply(
  id: string,
  user: User,
  body: string,
  hoursAgo: number,
  parentId: string | null = null,
): ActivityReply {
  const createdAt = isoOffset(0, 20)
  const t = new Date()
  t.setHours(t.getHours() - hoursAgo)
  return {
    id,
    activityId: LOCAL_SPACEX_ID,
    parentId,
    userId: user.id,
    userName: user.displayName,
    userAvatar: user.avatarUrl,
    body,
    createdAt: hoursAgo ? t.toISOString() : createdAt,
  }
}

const mira = LOCAL_BOTS[0]
const jules = LOCAL_BOTS[1]
const sofia = LOCAL_BOTS[2]
const rex = LOCAL_BOTS[3]
const kenji = LOCAL_BOTS[4]

export const LOCAL_REPLIES: ActivityReply[] = [
  reply("local_r1", sofia, "Roof is booked. Short-throw projector + a real speaker. Don’t bring a Bluetooth egg.", 30),
  reply("local_r2", jules, "I’ll be on the long lens if the west stays clear. Anyone got a spare battery grip?", 27),
  reply("local_r3", rex, "First launch ever. Is the countdown on the speaker, or are we all staring at our phones?", 22),
  reply("local_r4", mira, "Speaker. Phones down for T-0. I’ll shout if they hold.", 21, "local_r3"),
  reply("local_r5", kenji, "If it scrubs we still eat. That’s the only orbital law I enforce.", 18),
  reply("local_r6", sofia, "Ajvar, bread, two crates. Non-negotiable. Kenji you’re on ice.", 16, "local_r5"),
  reply("local_r7", jules, "Landing burn or it didn’t happen. I’ll put the replay on the wall after.", 9),
  reply("local_r8", rex, "Coming from Vračar at 20:40. Saving two seats near the rail.", 4),
]

export const LOCAL_MEMBERS: ActivityMember[] = LOCAL_BOTS.map((person, index) => ({
  id: `${LOCAL_SPACEX_ID}_${person.id}`,
  activityId: LOCAL_SPACEX_ID,
  userId: person.id,
  status: "joined" as const,
  joinedAt: isoOffset(-2, 19, 20 + index),
  role: person.id === "local_mira" ? "organizer" : "member",
}))

export function isLocalSceneId(id: string) {
  return id.startsWith("local_")
}

export function mergeById<T extends { id: string }>(base: T[], extra: T[]) {
  const byId = new Map<string, T>()
  for (const row of extra) byId.set(row.id, row)
  for (const row of base) byId.set(row.id, row)
  return [...byId.values()]
}

export function localBot(id: string) {
  return LOCAL_BOTS.find((person) => person.id === id) ?? null
}
