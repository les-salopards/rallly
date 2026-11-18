"use client";
import { buttonVariants } from "@rallly/ui";
import { Alert, AlertAction, AlertDescription } from "@rallly/ui/alert";
import { LockIcon, LogInIcon } from "lucide-react";
import { Link } from "@/components/link";
import { useGroupAccess, usePoll } from "@/features/poll/client";
import { Trans } from "@/i18n/client";

/**
 * Explains why the response form is missing on a poll reserved to an OIDC
 * group: a guest is offered the sign-in, a signed-in outsider is told the
 * poll is not for them. Members and open polls see nothing.
 */
export function GroupRestrictionBanner() {
  const poll = usePoll();
  const groupAccess = useGroupAccess();

  if (!poll.allowedGroup) {
    return null;
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
          <Link
            className={buttonVariants({ variant: "primary", size: "sm" })}
            href={`/login?redirectTo=${encodeURIComponent(`/invite/${poll.id}`)}`}
            prefetch={false}
          >
            <LogInIcon className="size-4" />
            <Trans i18nKey="login" defaults="Login" />
          </Link>
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
