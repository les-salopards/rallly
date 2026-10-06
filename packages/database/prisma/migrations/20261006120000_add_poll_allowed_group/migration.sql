-- Lets an organizer reserve a poll to the members of one OIDC group
-- (an Authentik group on our instance). Null keeps the poll open to anyone
-- with the link, so every existing poll is unchanged.
ALTER TABLE "polls" ADD COLUMN "allowed_group" TEXT;
