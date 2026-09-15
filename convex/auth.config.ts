// convex/auth.config.ts

import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://securetoken.google.com/debrouillepro-84316",
      applicationID: "debrouillepro-84316",
    },
  ],
} satisfies AuthConfig;
