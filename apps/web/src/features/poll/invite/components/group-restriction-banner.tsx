"use client";
import { buttonVariants } from "@rallly/ui";
import { Alert, AlertAction, AlertDescription } from "@rallly/ui/alert";
import { LockIcon, LogInIcon, UserCheckIcon } from "lucide-react";
import { Link } from "@/components/link";
import {
  useGroupAccess,
  useIdentityLocked,
  usePoll,
} from "@/features/poll/client";
import { useUser } from "@/features/user/client";
import { Trans } from "@/i18n/client";

function LoginLink({ pollId }: { pollId: string }) {
  return (
    <Link
      className={buttonVariants({ variant: "primary", size: "sm" })}
      href={`/login?redirectTo=${encodeURIComponent(`/invite/${pollId}`)}`}
      prefetch={false}
    >
      <LogInIcon className="size-4" />
      <Trans i18nKey="login" defaults="Login" />
    </Link>
  );
}

/**
 * Explains why the response form is missing on a poll reserved to an OIDC
 * group: a guest is offered the sign-in, a signed-in outsider is told the
 * poll is not for them. Members and open polls see nothing.
 * With OIDC_VOTE_REQUIRED, polls without a group ask guests to sign in and
 * show signed-in voters the IdP identity their response will carry.
 */
export function GroupRestrictionBanner() {
  const poll = usePoll();
  const groupAccess = useGroupAccess();
  const identityLocked = useIdentityLocked();
  const { user } = useUser();

  if (!poll.allowedGroup) {
    if (!identityLocked) {
      return null;
    }

    if (groupAccess === "loginRequired") {
      return (
        <Alert variant="primary">
          <LockIcon />
          <AlertDescription>
            <p>
              <Trans
                i18nKey="oidcVoteLoginRequired"
                defaults="Sign in to respond: every response is tied to an account."
              />
            </p>
          </AlertDescription>
          <AlertAction>
            <LoginLink pollId={poll.id} />
          </AlertAction>
        </Alert>
      );
    }

    return user ? (
      <Alert>
        <UserCheckIcon />
        <AlertDescription>
          <p>
            <Trans
              i18nKey="oidcVoteSignedInAs"
              defaults="You respond as {name} ({email})."
              values={{ name: user.name, email: user.email ?? "" }}
            />
          </p>
        </AlertDescription>
      </Alert>
    ) : null;
  }

  if (groupAccess === "loginRequired") {
    return (
      <Alert variant="primary">
        <LockIcon />
        <AlertDescription>
          <p>
            <Trans
              i18nKey="groupRestrictedLoginRequired"
              defaults="This poll is reserved to members of the group {group}. Sign in to respond."
              values={{ group: poll.allowedGroup }}
            />
          </p>
        </AlertDescription>
        <AlertAction>
          <LoginLink pollId={poll.id} />
        </AlertAction>
      </Alert>
    );
  }

  if (groupAccess === "notMember") {
    return (
      <Alert variant="error">
        <LockIcon />
        <AlertDescription>
          <p>
            <Trans
              i18nKey="groupRestrictedNotMember"
              defaults="This poll is reserved to members of the group {group}. Your account is not in this group."
              values={{ group: poll.allowedGroup }}
            />
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <LockIcon />
      <AlertDescription>
        <p>
          <Trans
            i18nKey="groupRestrictedMember"
            defaults="Reserved to the group {group}."
            values={{ group: poll.allowedGroup }}
          />
        </p>
      </AlertDescription>
    </Alert>
  );
}
