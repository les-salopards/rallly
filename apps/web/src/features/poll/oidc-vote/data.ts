import "server-only";

import { prisma } from "@rallly/database";

/** Name and email as Better Auth copied them from the IdP at sign-in. */
export async function getAccountIdentity(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  return user ? { name: user.name, email: user.email ?? undefined } : null;
}
