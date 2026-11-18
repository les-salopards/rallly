type Identity = { name: string; email: string | undefined };

/**
 * The name and email a response is recorded under. With OIDC required the
 * client input is ignored: the response carries the identity the IdP
 * asserted at sign-in, so a voter cannot pose as someone else.
 */
export function resolveVoterIdentity({
  required,
  typed,
  account,
}: {
  required: boolean;
  typed: Identity;
  account: Identity | null;
}): Identity | null {
  if (!required) {
    return typed;
  }
  return account;
}
