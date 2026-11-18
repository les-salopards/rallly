import "server-only";

import { env } from "@/env";

export const isOidcVoteRequired = () => env.OIDC_VOTE_REQUIRED === "true";
