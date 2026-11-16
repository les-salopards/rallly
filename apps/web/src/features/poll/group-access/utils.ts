import { getValueByPath } from "@/lib/utils/get-value-by-path";

/**
 * Where the viewer stands on a poll reserved to one OIDC group:
 * - `open`: the poll has no group, anyone with the link may respond;
 * - `allowed`: signed in through OIDC and a member of the group;
 * - `loginRequired`: a guest, or a user who never signed in through OIDC;
 * - `notMember`: signed in through OIDC but outside the group.
 */
export type GroupAccess = "open" | "allowed" | "loginRequired" | "notMember";

/**
 * Reads the groups claim out of an OIDC ID token. The token is the one the
 * server itself fetched from the IdP's token endpoint at sign-in, so its
 * payload is trusted as stored; only its shape is checked here.
 */
export function readGroupsFromIdToken(
  idToken: string | null | undefined,
  claimPath: string,
): string[] | null {
  const payload = idToken?.split(".")[1];
  if (!payload) {
    return null;
  }

  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  const groups = getValueByPath(claims, claimPath);
  if (!Array.isArray(groups)) {
    return [];
  }
  return groups.filter((group): group is string => typeof group === "string");
}

/**
 * `groups` is null when the viewer has no OIDC identity at all, which is a
 * different answer (sign in) from an identity outside the group (refused).
 * `oidcRequired` (OIDC_VOTE_REQUIRED) extends the sign-in requirement to
 * every poll, with or without a group.
 */
export function evaluateGroupAccess({
  allowedGroup,
  isGuest,
  groups,
  oidcRequired = false,
}: {
  allowedGroup: string | null;
  isGuest: boolean;
  groups: string[] | null;
  oidcRequired?: boolean;
}): GroupAccess {
  if (!allowedGroup && !oidcRequired) {
    return "open";
  }
  if (isGuest || groups === null) {
    return "loginRequired";
  }
  if (!allowedGroup) {
    return "allowed";
  }
  return groups.includes(allowedGroup) ? "allowed" : "notMember";
}

/** The group name as the organizer typed it; blank clears the restriction. */
export function normalizeAllowedGroup(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
