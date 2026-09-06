// src/features/events/permissions.ts
export const PERMISSIONS = {
  CREATE: "events:create",
  READ: "events:read",
  UPDATE: "events:update",
  DELETE: "events:delete",
  RSVP: "events:rsvp",
  TICKETS: "events:tickets",
  COMMENTS: "events:comments",
};

export const ROLES = {
  ADMIN: [
    "events:create",
    "events:read",
    "events:update",
    "events:delete",
    "events:rsvp",
    "events:tickets",
    "events:comments",
  ],
  ORGANIZER: ["events:create", "events:read", "events:update", "events:delete"],
  USER: ["events:read", "events:rsvp", "events:tickets", "events:comments"],
};
