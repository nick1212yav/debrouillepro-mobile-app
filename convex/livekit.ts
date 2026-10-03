// convex/livekit.ts
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { AccessToken } from "livekit-server-sdk";

type LiveKitTokenResult = {
  token: string;
  serverUrl: string;
  roomName: string;
  role: "host" | "viewer";
  canPublish: boolean;
  canSubscribe: true;
};

export const getLiveKitToken = action({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args): Promise<LiveKitTokenResult> => {
    // -----------------------------------------------------------------------
    // 1. AUTHENTIFICATION
    // -----------------------------------------------------------------------

    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("AUTH_REQUIRED");
    }

    // -----------------------------------------------------------------------
    // 2. UTILISATEUR
    // -----------------------------------------------------------------------

    const user = await ctx.runQuery(internal.livekitInternal.getUserByToken, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // -----------------------------------------------------------------------
    // 3. STREAM
    // -----------------------------------------------------------------------

    const stream = await ctx.runQuery(
      internal.livekitInternal.getStreamForToken,
      {
        streamId: args.streamId,
      },
    );

    if (!stream) {
      throw new Error("STREAM_NOT_FOUND");
    }

    // -----------------------------------------------------------------------
    // 4. VALIDATION DU STREAM
    // -----------------------------------------------------------------------

    if (stream.status !== "live") {
      throw new Error("STREAM_NOT_LIVE");
    }

    if (stream.isDeleted) {
      throw new Error("STREAM_DELETED");
    }

    if (!stream.isActive) {
      throw new Error("STREAM_INACTIVE");
    }

    // -----------------------------------------------------------------------
    // 5. IDENTITÉ / RÔLE
    // -----------------------------------------------------------------------

    const userId = user._id;
    const isHost = stream.hostId === userId;

    /*
     * Le host peut toujours publier.
     *
     * Pour les autres utilisateurs, la décision est déléguée au backend
     * liveCohosts via une internal query.
     *
     * Rôles pouvant publier :
     *   - host
     *   - cohost accepté
     *   - guest accepté
     *
     * Un moderator accepté n'est pas automatiquement publisher.
     */
    const canPublishByRole = await ctx.runQuery(
      internal.liveCohosts.canPublishInternal,
      {
        streamId: args.streamId,
        userId,
      },
    );

    const canPublish = isHost || canPublishByRole;

    // -----------------------------------------------------------------------
    // 6. CREDENTIALS LIVEKIT
    // -----------------------------------------------------------------------

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      throw new Error("LIVEKIT_CONFIGURATION_MISSING");
    }

    // -----------------------------------------------------------------------
    // 7. ROOM
    // -----------------------------------------------------------------------

    /*
     * IMPORTANT :
     *
     * Le nom de room doit être strictement identique dans :
     *
     *   - LiveKit token
     *   - frontend publisher
     *   - frontend viewer
     *   - Replay / Egress
     *
     * Convention canonique :
     *
     *   stream-${streamId}
     */
    const roomName = `stream-${args.streamId}`;

    // -----------------------------------------------------------------------
    // 8. TOKEN LIVEKIT
    // -----------------------------------------------------------------------

    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity: String(userId),
      name: user.name ?? "Utilisateur",
      ttl: "6h",
    });

    accessToken.addGrant({
      room: roomName,
      roomJoin: true,

      // Host / cohost / guest accepté :
      // publication caméra + microphone.
      //
      // Viewer :
      // subscribe-only.
      canPublish,

      // Tous les participants peuvent recevoir
      // les tracks distantes.
      canSubscribe: true,

      // Seuls les publishers autorisés peuvent envoyer
      // des données LiveKit.
      canPublishData: canPublish,
    });

    const token = await accessToken.toJwt();

    // -----------------------------------------------------------------------
    // 9. RÉPONSE
    // -----------------------------------------------------------------------

    return {
      token,
      serverUrl,
      roomName,
      role: isHost ? "host" : "viewer",
      canPublish,
      canSubscribe: true,
    };
  },
});
