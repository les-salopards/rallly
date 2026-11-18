import "server-only";

import { prisma } from "@rallly/database";
import { env } from "@/env";
import { hasPollAdminAccess } from "@/features/poll/data";
import type { GroupAccess } from "@/features/poll/group-access/utils";
import {
  evaluateGroupAccess,
  readGroupsFromIdToken,
} from "@/features/poll/group-access/utils";

/**
 * The groups the IdP asserted at the user's last OIDC sign-in, or null when
 * the user has no OIDC account. Better Auth rewrites the stored ID token on
 * every sign-in, so a group change takes effect at the next login.
 */
export async function getUserOidcGroups(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "oidc" },
    select: { id_token: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!account) {
    return null;
  }

  return readGroupsFromIdToken(account.id_token, env.OIDC_GROUPS_CLAIM_PATH);
}

/**
 * Whether this viewer may respond to a poll reserved to a group. The poll's
 * organizers keep full access so they can manage responses on their own
 * poll whatever their groups.
 */
export async function getGroupAccess({
  pollId,
  allowedGroup,
  user,
}: {
  pollId: string;
  allowedGroup: string | null;
  user: { id: string; isGuest: boolean } | null;
}): Promise<GroupAccess> {
  if (!allowedGroup) {
    return "open";
  }

  if (!user || user.isGuest) {
    return "loginRequired";
  }

  if (await hasPollAdminAccess(pollId, user.id)) {
    return "allowed";
  }

  return evaluateGroupAccess({
    allowedGroup,
    isGuest: false,
    groups: await getUserOidcGroups(user.id),
  });
}

/** True when the viewer is barred from responding by the poll's group. */
export const isGroupAccessDenied = (access: GroupAccess) =>
  access === "loginRequired" || access === "notMember";

/**
 * The server-side gate the vote actions call: reads the poll's group itself
 * so a client can never skip it by sending a stale poll.
 */
export async function getPollGroupAccess({
  pollId,
  user,
}: {
  pollId: string;
  user: { id: string; isGuest: boolean } | null;
}) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { allowedGroup: true },
  });

  return getGroupAccess({
    pollId,
    allowedGroup: poll?.allowedGroup ?? null,
    user,
  });
}
