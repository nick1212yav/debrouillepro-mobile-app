import { internalMutation } from "./_generated/server";

export const migrateMessages = internalMutation({
  args: {},

  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();

    let migrated = 0;

    for (const message of messages) {
      if (message.type === undefined) {
        await ctx.db.patch(message._id, {
          type: "text",
        });

        migrated++;
      }
    }

    return {
      total: messages.length,
      migrated,
    };
  },
});

export const migrateConversationMembers = internalMutation({
  args: {},

  handler: async (ctx) => {
    const members = await ctx.db.query("conversationMembers").collect();

    let migrated = 0;

    for (const member of members) {
      const patch: {
        role?: "owner" | "admin" | "member";
        isMuted?: boolean;
      } = {};

      if (member.role === undefined) {
        patch.role = "member";
      }

      if (member.isMuted === undefined) {
        patch.isMuted = false;
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(member._id, patch);
        migrated++;
      }
    }

    return {
      total: members.length,
      migrated,
    };
  },
});
