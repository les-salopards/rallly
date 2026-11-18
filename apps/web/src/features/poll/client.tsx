"use client";
import React from "react";
import { useRequiredContext } from "@/components/use-required-context";
import type { GroupAccess } from "@/features/poll/group-access/utils";
import type {
  PollComment,
  PollDetails,
  PollParticipant,
} from "@/features/poll/types";
import { useUser } from "@/features/user/client";
import { useTranslation } from "@/i18n/client";

type PollContextValue = {
  poll: PollDetails;
  participants: PollParticipant[];
  comments: PollComment[];
  /**
   * Responses the emailed link in the URL may edit, resolved on the server
   * from the same token the actions check.
   */
  linkedParticipantIds: string[];
  /** Which surface the page is: the host's admin page or the invite page. */
  viewerRole: "admin" | "participant";
  /** The viewer's standing on a poll reserved to an OIDC group. */
  groupAccess: GroupAccess;
  /** OIDC_VOTE_REQUIRED: responses carry the IdP name and email, fixed. */
  identityLocked: boolean;
};

const PollContext = React.createContext<PollContextValue | null>(null);

PollContext.displayName = "PollProvider";

/**
 * Serves the poll a page loaded on the server. Writes go through server
 * actions followed by router.refresh(), which re-renders the page with new
 * props; nothing here is patched on the client.
 */
export function PollProvider({
  poll,
  participants,
  comments,
  linkedParticipantIds = [],
  viewerRole,
  groupAccess = "open",
  identityLocked = false,
  children,
}: Omit<
  PollContextValue,
  "linkedParticipantIds" | "groupAccess" | "identityLocked"
> & {
  linkedParticipantIds?: string[];
  groupAccess?: GroupAccess;
  identityLocked?: boolean;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({
      poll,
      participants,
      comments,
      linkedParticipantIds,
      viewerRole,
      groupAccess,
      identityLocked,
    }),
    [
      poll,
      participants,
      comments,
      linkedParticipantIds,
      viewerRole,
      groupAccess,
      identityLocked,
    ],
  );

  return <PollContext.Provider value={value}>{children}</PollContext.Provider>;
}

export const usePoll = () => useRequiredContext(PollContext).poll;

/** The poll when a provider is mounted, for components shared with pages
 * that pass their data as props instead. */
export const usePollOrNull = () => React.useContext(PollContext)?.poll ?? null;

export const useRole = () => useRequiredContext(PollContext).viewerRole;

export const useComments = () => useRequiredContext(PollContext).comments;

export const useParticipants = () => {
  const { t } = useTranslation();
  const { participants: rawParticipants } = useRequiredContext(PollContext);

  const participants = React.useMemo(() => {
    return rawParticipants.map((participant, index) => {
      if (!participant.hidden) {
        return participant;
      }

      return {
        ...participant,
        name: t("hiddenParticipantName", {
          defaultValue: "Participant #{number}",
          number: rawParticipants.length - index,
        }),
      };
    });
  }, [rawParticipants, t]);

  return { participants };
};

export const useGroupAccess = () => useRequiredContext(PollContext).groupAccess;

export const useIdentityLocked = () =>
  React.useContext(PollContext)?.identityLocked ?? false;

export const usePermissions = () => {
  const { poll, participants, linkedParticipantIds, viewerRole, groupAccess } =
    useRequiredContext(PollContext);
  const { user } = useUser();
  // Mirrors the check in the vote actions, which have the final say.
  const groupAllows = groupAccess === "open" || groupAccess === "allowed";

  return {
    canAddNewParticipant: poll.status === "open" && groupAllows,
    canEditParticipant: (participantId: string) => {
      if (poll.status !== "open") {
        return false;
      }

      if (!groupAllows) {
        return false;
      }

      if (viewerRole === "admin") {
        return true;
      }

      const participant = participants.find(
        (participant) => participant.id === participantId,
      );

      if (!participant) {
        return false;
      }

      return (
        (!!user && participant.userId === user.id) ||
        linkedParticipantIds.includes(participantId)
      );
    },
  };
};
