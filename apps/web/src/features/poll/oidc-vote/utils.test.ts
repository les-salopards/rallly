import { describe, expect, it } from "vitest";
import { resolveVoterIdentity } from "./utils";

const typed = { name: "Typed name", email: "typed@example.com" };
const account = { name: "Alice", email: "alice@example.com" };

describe("resolveVoterIdentity", () => {
  it("keeps what the voter typed when OIDC is not required", () => {
    expect(resolveVoterIdentity({ required: false, typed, account })).toEqual(
      typed,
    );
  });

  it("uses the identity from the IdP when OIDC is required", () => {
    expect(resolveVoterIdentity({ required: true, typed, account })).toEqual(
      account,
    );
  });

  it("refuses when OIDC is required but the account is unknown", () => {
    expect(
      resolveVoterIdentity({ required: true, typed, account: null }),
    ).toBeNull();
  });
});
