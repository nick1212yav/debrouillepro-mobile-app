// src/features/community/permissions.ts
export const permissions = {
  view: ["*"],
  create: ["user"],
  comment: ["user"],
  like: ["user"],
  delete: ["user", "admin"],
  moderate: ["admin"],
  ban: ["admin"],
  createGroup: ["user"],
  manageGroup: ["admin", "groupAdmin"],
  createEvent: ["user"],
  manageEvent: ["admin", "eventOrganizer"],
  createStory: ["user"],
  startLive: ["user", "premium"],
  boost: ["user", "premium"],
};
