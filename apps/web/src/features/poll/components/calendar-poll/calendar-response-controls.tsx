import { Button } from "@rallly/ui/button";
import { PencilIcon, PlusIcon } from "lucide-react";
import { useParticipants, usePermissions } from "@/features/poll/client";
import { VotingFooter } from "@/features/poll/components/voting-footer";
import { useVotingForm } from "@/features/poll/components/voting-form";
import { useUser } from "@/features/user/client";
import { Trans } from "@/i18n/client";

/**
 * The table carries its response controls in its rows, so the calendar
 * renders its own: start or edit a response, then the shared voting footer,
 * which submits the same voting form and therefore the same server actions.
 */
export function CalendarResponseControls() {
  const votingForm = useVotingForm();
  const { participants } = useParticipants();
  const { ownsObject } = useUser();
  const { canAddNewParticipant, canEditParticipant } = usePermissions();
  const mode = votingForm.watch("mode");
  const ownParticipant = participants.find((p) => ownsObject(p));

  if (mode !== "view") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2 border-t p-3">
        {mode === "edit" ? (
          <Button variant="ghost" onClick={() => votingForm.cancel()}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </Button>
        ) : null}
        <VotingFooter />
      </div>
    );
  }

  if (ownParticipant && canEditParticipant(ownParticipant.id)) {
    return (
      <div className="flex justify-end border-t p-3">
        <Button
          onClick={() => votingForm.setEditingParticipantId(ownParticipant.id)}
        >
          <PencilIcon />
          <Trans i18nKey="calendarEditResponse" defaults="Edit my response" />
        </Button>
      </div>
    );
  }

  if (!ownParticipant && canAddNewParticipant) {
    return (
      <div className="flex justify-end border-t p-3">
        <Button onClick={() => votingForm.newParticipant()}>
          <PlusIcon />
          <Trans i18nKey="calendarRespond" defaults="Respond" />
        </Button>
      </div>
    );
  }

  return null;
}
