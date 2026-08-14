import { defaultHeadcount } from "@/lib/headcount";
import type { Activity, ActivityMember } from "@/lib/types";
import { hashPassword } from "@/lib/utils";
import {
  SEED_VERSION,
  STORAGE_KEYS,
  type StoredUser,
  loadDb,
  saveDb,
} from "@/lib/data/store";

const DEMO_PASSWORD = "demo1234";

function iso(date: string) {
  return new Date(date).toISOString();
}

function buildUsers(passwordHash: string): Record<string, StoredUser> {
  const createdAt = iso("2026-06-01T10:00:00+02:00");
  return {
    user_maya: {
      id: "user_maya",
      displayName: "Maya Chen",
      email: "maya@gmail.com",
      bio: "Product designer who would rather make things with people than stare at Figma alone.",
      skills: ["Product design", "Facilitation", "Illustration"],
      avatarUrl: null,
      location: "Belgrade",
      visibility: "public",
      createdAt,
      updatedAt: createdAt,
      passwordHash,
    },
    user_luka: {
      id: "user_luka",
      displayName: "Luka Petrović",
      email: "luka@example.com",
      bio: "CS PhD student. I organize things so I have to show up to them.",
      skills: ["Python", "Research", "Backend"],
      avatarUrl: null,
      location: "Belgrade",
      visibility: "public",
      createdAt,
      updatedAt: createdAt,
      passwordHash,
    },
    user_ana: {
      id: "user_ana",
      displayName: "Ana Kovač",
      email: "ana@example.com",
      bio: "If it involves moving or being outside, I'm in.",
      skills: ["Climbing", "Football", "Coaching"],
      avatarUrl: null,
      location: "Novi Sad",
      visibility: "private",
      createdAt,
      updatedAt: createdAt,
      passwordHash,
    },
    user_sam: {
      id: "user_sam",
      displayName: "Sam Okonkwo",
      email: "sam@example.com",
      bio: "Narrative designer. Always looking for a table, a jam, or a strange idea.",
      skills: ["Game design", "Writing", "Unity"],
      avatarUrl: null,
      location: "Online",
      visibility: "public",
      createdAt,
      updatedAt: createdAt,
      passwordHash,
    },
    user_marko: {
      id: "user_marko",
      displayName: "Marko Njegomir",
      email: "marko@cradlink.com",
      bio: "Doctoral student. I start things so other people have a place to show up.",
      skills: ["AI", "Research", "Building"],
      avatarUrl: null,
      location: "Belgrade",
      visibility: "public",
      createdAt,
      updatedAt: createdAt,
      passwordHash,
    },
    user_bogdan: {
      id: "user_bogdan",
      displayName: "Bogdan Ljubinkovic",
      email: "bogdan@cradlink.com",
      bio: "I like projects that make it easier for people to find each other.",
      skills: ["Product", "Community", "Software"],
      avatarUrl: null,
      location: "Belgrade",
      visibility: "public",
      createdAt,
      updatedAt: createdAt,
      passwordHash,
    },
  };
}

function decorateActivity(activity: Omit<Activity, "joinPolicy" | "headcount"> | Activity): Activity {
  const row = activity as Activity;
  return {
    ...row,
    tags: row.tags ?? [],
    joinPolicy: row.joinPolicy ?? "auto",
    headcount: row.headcount ?? defaultHeadcount(row.capacity),
  };
}

function featuredActivities(): Record<string, Activity> {
  return {
    act_spacex: decorateActivity({
      id: "act_spacex",
      title: "SpaceX launch watch party",
      description:
        "Projector, snacks, and the countdown. We watch the next SpaceX launch together — commentary optional, awe required. Bring a jacket if we end up on the terrace.",
      type: "social",
      tags: ["Space", "Launch", "Watch party"],
      lookingFor: ["Space fans", "Night owls"],
      location: { type: "in-person", city: "Belgrade", venue: "Dorćol, rooftop / living room if it rains" },
      startAt: iso("2026-08-22T21:00:00+02:00"),
      endAt: iso("2026-08-22T23:30:00+02:00"),
      isFlexible: false,
      capacity: null,
      joinPolicy: "auto",
      headcount: { mode: "estimate", about: 15 },
      creatorId: "user_marko",
      creatorName: "Marko Njegomir",
      creatorAvatar: null,
      memberCount: 1,
      status: "open",
      createdAt: iso("2026-08-14T22:00:12+02:00"),
      updatedAt: iso("2026-08-14T22:00:12+02:00"),
      visibility: "public",
      images: ["/activities/spacex.jpg"],
    }),
    act_imagine: decorateActivity({
      id: "act_imagine",
      title: "Make a short film with Grok Imagine 2.0",
      description:
        "A weekend to actually finish something: a 60–90 second film generated and edited with Grok Imagine 2.0. We’ll pick a tiny story, generate shots, and cut it. Taste > tools. Request to join — I want a small crew, not a crowd.",
      type: "film",
      tags: ["Film", "AI", "Grok", "Short film"],
      lookingFor: ["Writer", "Editor", "Visual taste"],
      location: { type: "hybrid", city: "Belgrade", venue: "Studio / Discord" },
      startAt: iso("2026-08-29T11:00:00+02:00"),
      endAt: iso("2026-08-30T20:00:00+02:00"),
      isFlexible: false,
      capacity: 5,
      joinPolicy: "manual",
      headcount: { mode: "range", min: 3, max: 5 },
      creatorId: "user_marko",
      creatorName: "Marko Njegomir",
      creatorAvatar: null,
      memberCount: 1,
      status: "open",
      createdAt: iso("2026-08-14T22:00:11+02:00"),
      updatedAt: iso("2026-08-14T22:00:11+02:00"),
      visibility: "public",
      images: ["/activities/imagine.jpg"],
    }),
    act_connect: decorateActivity({
      id: "act_connect",
      title: "Let’s build a project that helps connect people",
      description:
        "I want to build something that makes it easier for people to find each other and do things together. No slide deck. We talk, we sketch, we ship a first version. If you’ve felt the same itch, come.",
      type: "software",
      tags: ["Community", "Product", "Build"],
      lookingFor: ["Builder", "Designer", "Product"],
      location: { type: "in-person", city: "Belgrade", venue: "KC Grad / café with plugs" },
      startAt: iso("2026-08-23T17:00:00+02:00"),
      endAt: iso("2026-08-23T21:00:00+02:00"),
      isFlexible: true,
      capacity: null,
      joinPolicy: "auto",
      headcount: { mode: "open" },
      creatorId: "user_bogdan",
      creatorName: "Bogdan Ljubinkovic",
      creatorAvatar: null,
      memberCount: 1,
      status: "open",
      createdAt: iso("2026-08-14T22:00:10+02:00"),
      updatedAt: iso("2026-08-14T22:00:10+02:00"),
      visibility: "public",
      images: ["/activities/connect.jpg"],
    }),
    act_neuralink: decorateActivity({
      id: "act_neuralink",
      title: "Multidisciplinary research: AI, sleep, and Neuralink",
      description:
        "A research project at the intersection of AI in medicine, sleep, and neural interfaces (Neuralink-class BCIs). I need people who can think across fields — not just one paper each. Clinician, ML, sleep science, hardware. We’ll scope a real question we can work on this semester. Requests only.",
      type: "research",
      tags: ["AI", "Medicine", "Sleep", "BCI"],
      lookingFor: ["Clinician", "ML", "Sleep science", "Hardware"],
      location: { type: "hybrid", city: "Belgrade", venue: "Faculty + online" },
      startAt: iso("2026-09-02T18:00:00+02:00"),
      endAt: iso("2026-09-02T20:30:00+02:00"),
      isFlexible: false,
      capacity: 6,
      joinPolicy: "manual",
      headcount: { mode: "range", min: 4, max: 6 },
      creatorId: "user_marko",
      creatorName: "Marko Njegomir",
      creatorAvatar: null,
      memberCount: 1,
      status: "open",
      createdAt: iso("2026-08-14T22:00:09+02:00"),
      updatedAt: iso("2026-08-14T22:00:09+02:00"),
      visibility: "public",
      images: ["/activities/neuralink.jpg"],
    }),
    act_seti: decorateActivity({
      id: "act_seti",
      title: "SETI board game night",
      description:
        "We play SETI: Search for Extraterrestrial Intelligence. I’ll teach. One table, no rush, snacks exist. Five seats including me.",
      type: "boardgames",
      tags: ["SETI", "Strategy", "Space"],
      lookingFor: ["Players", "Rules teacher"],
      location: { type: "in-person", city: "Belgrade", venue: "Play Board Game Cafe" },
      startAt: iso("2026-08-28T18:30:00+02:00"),
      endAt: iso("2026-08-28T23:00:00+02:00"),
      isFlexible: false,
      capacity: 5,
      joinPolicy: "auto",
      headcount: { mode: "limit", max: 5 },
      creatorId: "user_sam",
      creatorName: "Sam Okonkwo",
      creatorAvatar: null,
      memberCount: 1,
      status: "open",
      createdAt: iso("2026-08-14T22:00:08+02:00"),
      updatedAt: iso("2026-08-14T22:00:08+02:00"),
      visibility: "public",
      images: ["/activities/seti.jpg"],
    }),
    act_film: decorateActivity({
      id: "act_film",
      title: "Film a movie (cameras, not prompts)",
      description:
        "A real short: people, locations, a weekend. I have a camera and a half-written scene. Looking for a small crew — not a crowd. I’ll accept people by hand so the set stays sane.",
      type: "film",
      tags: ["Film", "On location", "Short"],
      lookingFor: ["Camera", "Sound", "Actor", "Locations"],
      location: { type: "in-person", city: "Belgrade", venue: "TBD neighborhood streets" },
      startAt: iso("2026-09-12T09:00:00+02:00"),
      endAt: iso("2026-09-13T21:00:00+02:00"),
      isFlexible: false,
      capacity: 12,
      joinPolicy: "manual",
      headcount: { mode: "range", min: 6, max: 12 },
      creatorId: "user_maya",
      creatorName: "Maya Chen",
      creatorAvatar: null,
      memberCount: 1,
      status: "open",
      createdAt: iso("2026-08-14T22:00:07+02:00"),
      updatedAt: iso("2026-08-14T22:00:07+02:00"),
      visibility: "public",
      images: ["/activities/film.jpg"],
    }),
    act_microhack: decorateActivity({
      id: "act_microhack",
      title: "Microhackathon with Grok",
      description:
        "A short, sharp hack to build agency: ship a small application with Grok as the pair. Not a lecture. You leave with something running and a better sense that you can make things. Roughly a roomful of people.",
      type: "hackathon",
      tags: ["Hackathon", "Grok", "Build"],
      lookingFor: ["Beginners", "First-time shippers"],
      location: { type: "in-person", city: "Belgrade", venue: "Startit" },
      startAt: iso("2026-09-05T10:00:00+02:00"),
      endAt: iso("2026-09-05T18:00:00+02:00"),
      isFlexible: false,
      capacity: null,
      joinPolicy: "auto",
      headcount: { mode: "estimate", about: 10 },
      creatorId: "user_marko",
      creatorName: "Marko Njegomir",
      creatorAvatar: null,
      memberCount: 1,
      status: "open",
      createdAt: iso("2026-08-14T22:00:06+02:00"),
      updatedAt: iso("2026-08-14T22:00:06+02:00"),
      visibility: "public",
      images: ["/activities/microhack.jpg"],
    }),
    act_bball: decorateActivity({
      id: "act_bball",
      title: "Pickup basketball",
      description:
        "Outdoor court, mixed, we keep it friendly. Looking for ten so we can run full court. Instant join until it’s full.",
      type: "sports",
      tags: ["Basketball", "Pickup", "Outdoor"],
      lookingFor: ["Any position", "Bring a ball"],
      location: { type: "in-person", city: "Belgrade", venue: "Ada Ciganlija courts" },
      startAt: iso("2026-08-17T18:00:00+02:00"),
      endAt: iso("2026-08-17T20:00:00+02:00"),
      isFlexible: false,
      capacity: 10,
      joinPolicy: "auto",
      headcount: { mode: "limit", max: 10 },
      creatorId: "user_ana",
      creatorName: "Ana Kovač",
      creatorAvatar: null,
      memberCount: 1,
      status: "open",
      createdAt: iso("2026-08-14T22:00:05+02:00"),
      updatedAt: iso("2026-08-14T22:00:05+02:00"),
      visibility: "public",
      images: ["/activities/bball.jpg"],
    }),
    act_bookclub: decorateActivity({
      id: "act_bookclub",
      title: "Book club",
      description:
        "One book a month, no homework police. August/September pick announced in the chat. Come if you read, or if you want to start again.",
      type: "workshop",
      tags: ["Books", "Discussion", "Monthly"],
      lookingFor: ["Readers"],
      location: { type: "in-person", city: "Belgrade", venue: "KC Grad café" },
      startAt: iso("2026-08-27T19:00:00+02:00"),
      endAt: iso("2026-08-27T21:00:00+02:00"),
      isFlexible: false,
      capacity: null,
      joinPolicy: "auto",
      headcount: { mode: "open" },
      creatorId: "user_luka",
      creatorName: "Luka Petrović",
      creatorAvatar: null,
      memberCount: 1,
      status: "open",
      createdAt: iso("2026-08-14T22:00:04+02:00"),
      updatedAt: iso("2026-08-14T22:00:04+02:00"),
      visibility: "public",
      images: ["/activities/bookclub.jpg"],
    }),
    act_walk: decorateActivity({
      id: "act_walk",
      title: "Go for a walk",
      description:
        "No destination. We meet at the fountain and walk until talking gets easier. No step count, no pace.",
      type: "social",
      tags: ["Walk", "Outdoors", "Easy"],
      lookingFor: ["Walkers", "Conversation"],
      location: { type: "in-person", city: "Belgrade", venue: "Kalemegdan, clock fountain" },
      startAt: iso("2026-08-16T17:30:00+02:00"),
      endAt: null,
      isFlexible: false,
      capacity: null,
      joinPolicy: "auto",
      headcount: { mode: "open" },
      creatorId: "user_maya",
      creatorName: "Maya Chen",
      creatorAvatar: null,
      memberCount: 1,
      status: "open",
      createdAt: iso("2026-08-14T22:00:03+02:00"),
      updatedAt: iso("2026-08-14T22:00:03+02:00"),
      visibility: "public",
      images: ["/activities/walk.jpg"],
    }),
    act_hike: decorateActivity({
      id: "act_hike",
      title: "Avaala / Kosmaj day hike",
      description:
        "A proper hike, not a stroll. Moderate pace, bring water and a sandwich. Roughly eight people so we stay one group.",
      type: "sports",
      tags: ["Hiking", "Outdoors", "Day trip"],
      lookingFor: ["Hikers", "Car"],
      location: { type: "in-person", city: "Belgrade", venue: "Meet at Banovo Brdo, 8:00" },
      startAt: iso("2026-08-30T08:00:00+02:00"),
      endAt: iso("2026-08-30T17:00:00+02:00"),
      isFlexible: false,
      capacity: null,
      joinPolicy: "auto",
      headcount: { mode: "estimate", about: 8 },
      creatorId: "user_ana",
      creatorName: "Ana Kovač",
      creatorAvatar: null,
      memberCount: 1,
      status: "open",
      createdAt: iso("2026-08-14T22:00:02+02:00"),
      updatedAt: iso("2026-08-14T22:00:02+02:00"),
      visibility: "public",
      images: ["/activities/hike.jpg"],
    }),
    act_watch: decorateActivity({
      id: "act_watch",
      title: "Watch a movie",
      description:
        "Couch, a film we vote on, tea. Looking for a small living-room group — two to six including me.",
      type: "social",
      tags: ["Movie night", "Film", "Couch"],
      lookingFor: ["Viewers", "Picks the film"],
      location: { type: "in-person", city: "Belgrade", venue: "Vračar apartment" },
      startAt: iso("2026-08-21T20:00:00+02:00"),
      endAt: iso("2026-08-21T23:00:00+02:00"),
      isFlexible: false,
      capacity: 6,
      joinPolicy: "auto",
      headcount: { mode: "range", min: 2, max: 6 },
      creatorId: "user_bogdan",
      creatorName: "Bogdan Ljubinkovic",
      creatorAvatar: null,
      memberCount: 1,
      status: "open",
      createdAt: iso("2026-08-14T22:00:01+02:00"),
      updatedAt: iso("2026-08-14T22:00:01+02:00"),
      visibility: "public",
      images: ["/activities/watch.jpg"],
    }),
  };
}

function buildActivities(): Record<string, Activity> {
  const raw = {
    ...featuredActivities(),
    act_hack: {
      id: "act_hack",
      title: "48-hour campus hack",
      description:
        "Build anything that helps students actually talk to each other. Demos Sunday evening. Food appears if we remember to order it. Bring a laptop and one idea you are slightly embarrassed about.",
      type: "hackathon",
      lookingFor: ["Designer", "Backend", "Mobile"],
      location: { type: "in-person", city: "Belgrade", venue: "FON, Jove Ilića 154" },
      startAt: iso("2026-09-12T10:00:00+02:00"),
      endAt: iso("2026-09-13T20:00:00+02:00"),
      isFlexible: false,
      capacity: 24,
      creatorId: "user_luka",
      creatorName: "Luka Petrović",
      creatorAvatar: null,
      memberCount: 3,
      status: "open",
      createdAt: iso("2026-08-01T09:00:00+02:00"),
      updatedAt: iso("2026-08-01T09:00:00+02:00"),
      visibility: "public",
      images: [],
    },
    act_workshop: {
      id: "act_workshop",
      title: "Interviewing humans (without making it weird)",
      description:
        "A short workshop on qualitative interviews for people who usually hide behind a survey. We practice opening questions, silence, and not leading the witness.",
      type: "workshop",
      lookingFor: ["Researchers", "Curious beginners"],
      location: { type: "online" },
      startAt: iso("2026-08-26T18:00:00+02:00"),
      endAt: iso("2026-08-26T20:00:00+02:00"),
      isFlexible: false,
      capacity: 16,
      creatorId: "user_maya",
      creatorName: "Maya Chen",
      creatorAvatar: null,
      memberCount: 2,
      status: "open",
      createdAt: iso("2026-08-03T12:00:00+02:00"),
      updatedAt: iso("2026-08-03T12:00:00+02:00"),
      visibility: "public",
      images: [],
    },
    act_reading: {
      id: "act_reading",
      title: "Science & society reading group",
      description:
        "One paper a month, drinks optional. August is about how labs actually decide what counts as a result. No prior theory required; strong opinions welcome if you brought the page numbers.",
      type: "research",
      lookingFor: ["PhD students", "Anyone who reads"],
      location: { type: "hybrid", city: "Belgrade", venue: "KC Grad / Meet" },
      startAt: iso("2026-08-20T19:00:00+02:00"),
      endAt: iso("2026-08-20T21:00:00+02:00"),
      isFlexible: false,
      capacity: null,
      creatorId: "user_luka",
      creatorName: "Luka Petrović",
      creatorAvatar: null,
      memberCount: 2,
      status: "open",
      createdAt: iso("2026-08-04T08:30:00+02:00"),
      updatedAt: iso("2026-08-04T08:30:00+02:00"),
      visibility: "public",
      images: [],
    },
    act_oss: {
      id: "act_oss",
      title: "Open-source study jam",
      description:
        "We pick a friendly repo, read the contributing guide out loud like it's literature, and land a tiny PR. Good for first-timers. Cameras optional, questions mandatory.",
      type: "software",
      lookingFor: ["Junior devs", "Docs writers"],
      location: { type: "online" },
      startAt: iso("2026-08-22T17:00:00+02:00"),
      endAt: iso("2026-08-22T19:30:00+02:00"),
      isFlexible: false,
      capacity: 12,
      creatorId: "user_sam",
      creatorName: "Sam Okonkwo",
      creatorAvatar: null,
      memberCount: 2,
      status: "open",
      createdAt: iso("2026-08-05T14:00:00+02:00"),
      updatedAt: iso("2026-08-05T14:00:00+02:00"),
      visibility: "public",
      images: [],
    },
    act_football: {
      id: "act_football",
      title: "Sunday pickup football",
      description:
        "Mixed, no slide tackles, we stop if someone brought a real job on Monday. Shin pads if you have them. We usually need one more.",
      type: "sports",
      lookingFor: ["Any position", "Someone who can count to 11"],
      location: { type: "in-person", city: "Belgrade", venue: "Ada Ciganlija, field 3" },
      startAt: iso("2026-08-16T10:00:00+02:00"),
      endAt: iso("2026-08-16T12:00:00+02:00"),
      isFlexible: false,
      capacity: 10,
      creatorId: "user_ana",
      creatorName: "Ana Kovač",
      creatorAvatar: null,
      memberCount: 9,
      status: "open",
      createdAt: iso("2026-08-06T07:00:00+02:00"),
      updatedAt: iso("2026-08-06T07:00:00+02:00"),
      visibility: "public",
      images: [],
    },
    act_board: {
      id: "act_board",
      title: "Heavy euros, light snacks",
      description:
        "Brass, Ark Nova, or whatever 2.5-hour box someone is brave enough to teach. Rules explainer rotates. Trash talk stays friendly.",
      type: "boardgames",
      lookingFor: ["Players", "Someone who owns Ark Nova"],
      location: { type: "in-person", city: "Belgrade", venue: "Play Board Game Cafe" },
      startAt: iso("2026-08-21T18:30:00+02:00"),
      endAt: iso("2026-08-21T23:00:00+02:00"),
      isFlexible: false,
      capacity: 5,
      creatorId: "user_sam",
      creatorName: "Sam Okonkwo",
      creatorAvatar: null,
      memberCount: 3,
      status: "open",
      createdAt: iso("2026-08-07T16:00:00+02:00"),
      updatedAt: iso("2026-08-07T16:00:00+02:00"),
      visibility: "public",
      images: [],
    },
    act_jam: {
      id: "act_jam",
      title: "Tiny game jam: one room",
      description:
        "Theme is 'one room'. Any engine. We check in Saturday morning and show whatever exists Sunday night, including elegant failures.",
      type: "game",
      lookingFor: ["Programmer", "Artist", "Sound"],
      location: { type: "hybrid", city: "Belgrade", venue: "Startit / Discord" },
      startAt: iso("2026-09-05T10:00:00+02:00"),
      endAt: iso("2026-09-06T20:00:00+02:00"),
      isFlexible: false,
      capacity: 18,
      creatorId: "user_sam",
      creatorName: "Sam Okonkwo",
      creatorAvatar: null,
      memberCount: 2,
      status: "open",
      createdAt: iso("2026-08-08T11:00:00+02:00"),
      updatedAt: iso("2026-08-08T11:00:00+02:00"),
      visibility: "public",
      images: [],
    },
    act_climb: {
      id: "act_climb",
      title: "Climbing gym intro night",
      description:
        "Belay-certified folks pair with first-timers. Shoes rentable at the desk. We leave when our fingers say so.",
      type: "sports",
      lookingFor: ["Beginners", "Belayers"],
      location: { type: "in-person", city: "Belgrade", venue: "Sportski centar Šumice" },
      startAt: iso("2026-08-19T19:00:00+02:00"),
      endAt: iso("2026-08-19T21:30:00+02:00"),
      isFlexible: false,
      capacity: 8,
      creatorId: "user_ana",
      creatorName: "Ana Kovač",
      creatorAvatar: null,
      memberCount: 2,
      status: "open",
      createdAt: iso("2026-08-09T09:15:00+02:00"),
      updatedAt: iso("2026-08-09T09:15:00+02:00"),
      visibility: "public",
      images: [],
    },
    act_cowork: {
      id: "act_cowork",
      title: "Thesis writing cowork (cameras optional)",
      description:
        "Pomodoros, a shared doc for stuck sentences, and a rule: no one asks 'how's the thesis' unless you bring it up. Flexible — drop in any weekday morning this month.",
      type: "research",
      lookingFor: ["Writers", "Accountability"],
      location: { type: "online" },
      startAt: null,
      endAt: null,
      isFlexible: true,
      capacity: null,
      creatorId: "user_maya",
      creatorName: "Maya Chen",
      creatorAvatar: null,
      memberCount: 2,
      status: "open",
      createdAt: iso("2026-08-10T08:00:00+02:00"),
      updatedAt: iso("2026-08-10T08:00:00+02:00"),
      visibility: "public",
      images: [],
    },
    act_rpg: {
      id: "act_rpg",
      title: "Indie RPG one-shot",
      description:
        "I'll run a one-shot of Mothership or Wanderhome, table's choice the week before. No prep, weird characters encouraged. Snacks exist in theory.",
      type: "boardgames",
      lookingFor: ["3–4 players"],
      location: { type: "in-person", city: "Novi Sad", venue: "KC Lab" },
      startAt: iso("2026-08-29T17:00:00+02:00"),
      endAt: iso("2026-08-29T22:00:00+02:00"),
      isFlexible: false,
      capacity: 5,
      creatorId: "user_sam",
      creatorName: "Sam Okonkwo",
      creatorAvatar: null,
      memberCount: 2,
      status: "open",
      createdAt: iso("2026-08-11T13:45:00+02:00"),
      updatedAt: iso("2026-08-11T13:45:00+02:00"),
      visibility: "public",
      images: [],
    },
    act_other: {
      id: "act_other",
      title: "Neighborhood repair cafe",
      description:
        "Bring a lamp, a chair, or a stubborn zipper. We have tools, patience, and tea. Not a professional workshop — a Saturday of trying.",
      type: "other",
      lookingFor: ["Fixers", "Curious hands"],
      location: { type: "in-person", city: "Belgrade", venue: "Dorćol Platz courtyard" },
      startAt: iso("2026-08-30T11:00:00+02:00"),
      endAt: iso("2026-08-30T15:00:00+02:00"),
      isFlexible: false,
      capacity: 20,
      creatorId: "user_maya",
      creatorName: "Maya Chen",
      creatorAvatar: null,
      memberCount: 1,
      status: "open",
      createdAt: iso("2026-08-12T10:20:00+02:00"),
      updatedAt: iso("2026-08-12T10:20:00+02:00"),
      visibility: "public",
      images: [],
    },
  };
  return Object.fromEntries(
    Object.entries(raw).map(([id, activity]) => [id, decorateActivity(activity as unknown as Activity)]),
  );
}

function member(
  activityId: string,
  userId: string,
  joinedAt: string,
  role?: string,
): ActivityMember {
  return {
    id: `${activityId}_${userId}`,
    activityId,
    userId,
    status: "joined",
    joinedAt,
    role,
  };
}

function buildMembers(): Record<string, ActivityMember> {
  const rows: ActivityMember[] = [
    member("act_spacex", "user_marko", iso("2026-08-14T22:00:12+02:00"), "organizer"),
    member("act_imagine", "user_marko", iso("2026-08-14T22:00:11+02:00"), "organizer"),
    member("act_connect", "user_bogdan", iso("2026-08-14T22:00:10+02:00"), "organizer"),
    member("act_neuralink", "user_marko", iso("2026-08-14T22:00:09+02:00"), "organizer"),
    member("act_seti", "user_sam", iso("2026-08-14T22:00:08+02:00"), "organizer"),
    member("act_film", "user_maya", iso("2026-08-14T22:00:07+02:00"), "organizer"),
    member("act_microhack", "user_marko", iso("2026-08-14T22:00:06+02:00"), "organizer"),
    member("act_bball", "user_ana", iso("2026-08-14T22:00:05+02:00"), "organizer"),
    member("act_bookclub", "user_luka", iso("2026-08-14T22:00:04+02:00"), "organizer"),
    member("act_walk", "user_maya", iso("2026-08-14T22:00:03+02:00"), "organizer"),
    member("act_hike", "user_ana", iso("2026-08-14T22:00:02+02:00"), "organizer"),
    member("act_watch", "user_bogdan", iso("2026-08-14T22:00:01+02:00"), "organizer"),
    member("act_hack", "user_luka", iso("2026-08-01T09:00:00+02:00"), "organizer"),
    member("act_hack", "user_maya", iso("2026-08-02T11:00:00+02:00")),
    member("act_hack", "user_sam", iso("2026-08-04T15:00:00+02:00")),
    member("act_workshop", "user_maya", iso("2026-08-03T12:00:00+02:00"), "organizer"),
    member("act_workshop", "user_luka", iso("2026-08-03T18:00:00+02:00")),
    member("act_reading", "user_luka", iso("2026-08-04T08:30:00+02:00"), "organizer"),
    member("act_reading", "user_maya", iso("2026-08-05T09:00:00+02:00")),
    member("act_oss", "user_sam", iso("2026-08-05T14:00:00+02:00"), "organizer"),
    member("act_oss", "user_luka", iso("2026-08-06T10:00:00+02:00")),
    member("act_football", "user_ana", iso("2026-08-06T07:00:00+02:00"), "organizer"),
    member("act_football", "user_luka", iso("2026-08-06T12:00:00+02:00")),
    member("act_football", "user_sam", iso("2026-08-07T08:00:00+02:00")),
    member("act_football", "user_maya", iso("2026-08-08T08:00:00+02:00")),
    ...["u1", "u2", "u3", "u4", "u5"].map((extra, i) =>
      member("act_football", `ghost_${extra}`, iso(`2026-08-0${8 + (i % 2)}T09:00:00+02:00`)),
    ),
    member("act_board", "user_sam", iso("2026-08-07T16:00:00+02:00"), "organizer"),
    member("act_board", "user_ana", iso("2026-08-08T12:00:00+02:00")),
    member("act_board", "user_maya", iso("2026-08-09T12:00:00+02:00")),
    member("act_jam", "user_sam", iso("2026-08-08T11:00:00+02:00"), "organizer"),
    member("act_jam", "user_luka", iso("2026-08-09T11:00:00+02:00")),
    member("act_climb", "user_ana", iso("2026-08-09T09:15:00+02:00"), "organizer"),
    member("act_climb", "user_maya", iso("2026-08-10T18:00:00+02:00")),
    member("act_cowork", "user_maya", iso("2026-08-10T08:00:00+02:00"), "organizer"),
    member("act_cowork", "user_luka", iso("2026-08-11T08:00:00+02:00")),
    member("act_rpg", "user_sam", iso("2026-08-11T13:45:00+02:00"), "organizer"),
    member("act_rpg", "user_ana", iso("2026-08-12T09:00:00+02:00")),
    member("act_other", "user_maya", iso("2026-08-12T10:20:00+02:00"), "organizer"),
  ];

  return Object.fromEntries(rows.map((row) => [row.id, row]));
}

function ghostUsers(): Record<string, StoredUser> {
  const names = ["Milan R.", "Ivana S.", "Teo N.", "Sara P.", "Niko V."];
  const createdAt = iso("2026-07-01T10:00:00+02:00");
  const extras = ["u1", "u2", "u3", "u4", "u5"];
  return Object.fromEntries(
    extras.map((id, i) => {
      const userId = `ghost_${id}`;
      const user: StoredUser = {
        id: userId,
        displayName: names[i],
        email: `${id}@ghost.local`,
        bio: "",
        skills: [],
        avatarUrl: null,
        location: "Belgrade",
        visibility: "public",
        createdAt,
        updatedAt: createdAt,
      };
      return [userId, user];
    }),
  );
}

let seedPromise: Promise<void> | null = null;

export function ensureSeed() {
  if (!seedPromise) seedPromise = seedInternal();
  return seedPromise;
}

async function seedInternal() {
  if (typeof window === "undefined") return;
  const db = loadDb();
  const already = localStorage.getItem(STORAGE_KEYS.seed) === SEED_VERSION;

  if (!already || Object.keys(db.activities).length === 0) {
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    const users = { ...buildUsers(passwordHash), ...ghostUsers() };
    for (const [id, user] of Object.entries(users)) {
      if (!db.users[id]) db.users[id] = user;
    }
    const marko = users.user_marko;
    if (marko) {
      db.users.user_marko = {
        ...db.users.user_marko,
        ...marko,
        displayName: "Marko Njegomir",
        email: "marko@cradlink.com",
      };
    }
    const activities = buildActivities();
    for (const [id, activity] of Object.entries(activities)) {
      if (!db.activities[id]) db.activities[id] = activity;
    }
    const featured = featuredActivities();
    for (const [id, fresh] of Object.entries(featured)) {
      const existing = db.activities[id];
      db.activities[id] = existing
        ? {
            ...existing,
            title: fresh.title,
            description: fresh.description,
            type: fresh.type,
            lookingFor: fresh.lookingFor,
            tags: fresh.tags,
            images: fresh.images,
          }
        : fresh;
    }
    const members = buildMembers();
    for (const [id, member] of Object.entries(members)) {
      if (!db.members[id]) db.members[id] = member;
    }
  }

  for (const activity of Object.values(db.activities)) {
    if (!Array.isArray(activity.images)) activity.images = [];
    if (!Array.isArray(activity.tags)) activity.tags = [];
    if (!activity.joinPolicy) activity.joinPolicy = "auto";
    if (!activity.headcount) activity.headcount = defaultHeadcount(activity.capacity);
  }
  saveDb(db);
  localStorage.setItem(STORAGE_KEYS.seed, SEED_VERSION);
}

export const DEMO_GOOGLE_USER_ID = "user_marko";
export const DEMO_ACCOUNT_EMAIL = "marko@cradlink.com";
export const DEMO_ACCOUNT_PASSWORD = DEMO_PASSWORD;
export const DEMO_ACCOUNT_HINT = "marko@cradlink.com / demo1234";
