import { describe, expect, it } from "vitest";
import {
  evaluateGroupAccess,
  normalizeAllowedGroup,
  readGroupsFromIdToken,
} from "./utils";

const idToken = (claims: Record<string, unknown>) =>
  [
    Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url"),
    Buffer.from(JSON.stringify(claims)).toString("base64url"),
    "signature",
  ].join(".");

describe("readGroupsFromIdToken", () => {
  it("reads the groups claim", () => {
    expect(
      readGroupsFromIdToken(
        idToken({ sub: "1", groups: ["rallly-users", "staff"] }),
        "groups",
      ),
    ).toEqual(["rallly-users", "staff"]);
  });

  it("follows a nested claim path", () => {
    expect(
      readGroupsFromIdToken(
        idToken({ realm_access: { roles: ["rallly-admins"] } }),
        "realm_access.roles",
      ),
    ).toEqual(["rallly-admins"]);
  });

  it("treats a missing claim as no groups", () => {
    expect(readGroupsFromIdToken(idToken({ sub: "1" }), "groups")).toEqual([]);
  });

  it("drops non-string entries", () => {
    expect(
      readGroupsFromIdToken(idToken({ groups: ["a", 1, null] }), "groups"),
    ).toEqual(["a"]);
  });

  it("returns null without a readable token", () => {
    expect(readGroupsFromIdToken(null, "groups")).toBeNull();
    expect(readGroupsFromIdToken("not-a-jwt", "groups")).toBeNull();
    expect(readGroupsFromIdToken("a.%%%.c", "groups")).toBeNull();
  });
});

describe("evaluateGroupAccess", () => {
  it("leaves a poll without a group open to anyone", () => {
    expect(
      evaluateGroupAccess({ allowedGroup: null, isGuest: true, groups: null }),
    ).toBe("open");
  });

  it("asks a guest to sign in", () => {
    expect(
      evaluateGroupAccess({
        allowedGroup: "rallly-users",
        isGuest: true,
        groups: null,
      }),
    ).toBe("loginRequired");
  });

  it("asks a user without an OIDC identity to sign in", () => {
    expect(
      evaluateGroupAccess({
        allowedGroup: "rallly-users",
        isGuest: false,
        groups: null,
      }),
    ).toBe("loginRequired");
  });

  it("allows a member of the group", () => {
    expect(
      evaluateGroupAccess({
        allowedGroup: "rallly-users",
        isGuest: false,
        groups: ["rallly-users"],
      }),
    ).toBe("allowed");
  });

  it("refuses a user outside the group", () => {
    expect(
      evaluateGroupAccess({
        allowedGroup: "rallly-users",
        isGuest: false,
        groups: ["rallly-admins"],
      }),
    ).toBe("notMember");
  });
});

describe("evaluateGroupAccess with OIDC required to vote", () => {
  it("asks a guest to sign in on a poll without a group", () => {
    expect(
      evaluateGroupAccess({
        allowedGroup: null,
        isGuest: true,
        groups: null,
        oidcRequired: true,
      }),
    ).toBe("loginRequired");
  });

  it("asks a user without an OIDC identity to sign in", () => {
    expect(
      evaluateGroupAccess({
        allowedGroup: null,
        isGuest: false,
        groups: null,
        oidcRequired: true,
      }),
    ).toBe("loginRequired");
  });

  it("allows any OIDC user on a poll without a group", () => {
    expect(
      evaluateGroupAccess({
        allowedGroup: null,
        isGuest: false,
        groups: [],
        oidcRequired: true,
      }),
    ).toBe("allowed");
  });

  it("still applies the group on a restricted poll", () => {
    expect(
      evaluateGroupAccess({
        allowedGroup: "rallly-users",
        isGuest: false,
        groups: ["rallly-admins"],
        oidcRequired: true,
      }),
    ).toBe("notMember");
  });
});

describe("normalizeAllowedGroup", () => {
  it("trims the name and clears blanks", () => {
    expect(normalizeAllowedGroup("  rallly-users ")).toBe("rallly-users");
    expect(normalizeAllowedGroup("   ")).toBeNull();
    expect(normalizeAllowedGroup(undefined)).toBeNull();
  });
});
