import * as React from "react";
import {
  useParticipants,
  usePermissions,
  useRole,
} from "@/features/poll/client";
import { useOptions, usePoll } from "@/features/poll/components/poll-context";
import { useVisibility } from "@/features/poll/components/visibility";
import { useVotingForm } from "@/features/poll/components/voting-form";
import type { VoteType } from "@/features/poll/constants";
import { useUser } from "@/features/user/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { getCalendarDate } from "@/lib/datetime/utils";
import {
  getBrowserTimeZone,
  getOptionDateTimeLabel,
} from "@/lib/utils/date-time-utils";
import type { CalendarSlotModel } from "./calendar-day";
import { findViewerParticipant, groupOptionsByDay } from "./utils";

/**
 * Everything the calendar views need, read from the same poll context and
 * voting form as the table: there is no calendar-specific vote state, so the
 * table and the calendar always show the same response.
 */
export function useCalendarModel() {
  const { poll, getScore, getVote } = usePoll();
  const { options } = useOptions();
  const { participants } = useParticipants();
  const { ownsObject } = useUser();
  const votingForm = useVotingForm();
  const { timeZone, locale, weekStart } = useDateTimeConfig();
  const viewerTimeZone = timeZone ?? getBrowserTimeZone();

  const mode = votingForm.watch("mode");
  const formVotes = votingForm.watch("votes");
  const editable = mode !== "view";
  const { canEditParticipant } = usePermissions();
  const role = useRole();
  const { canSeeScores } = useVisibility();
  const ownParticipant = findViewerParticipant(participants, {
    role,
    owns: ownsObject,
    canEdit: canEditParticipant,
  });

  const days = React.useMemo(
    () =>
      groupOptionsByDay(poll.options, {
        pollTimeZone: poll.timeZone,
        viewerTimeZone,
      }),
    [poll.options, poll.timeZone, viewerTimeZone],
  );

  const labels = React.useMemo(
    () =>
      new Map(
        options.map((option) => [
          option.optionId,
          option.type === "timeSlot"
            ? {
                label: option.startTime,
                range: `${option.startTime} – ${option.endTime}`,
                optionLabel: getOptionDateTimeLabel(option),
              }
            : {
                label: null,
                range: null,
                optionLabel: getOptionDateTimeLabel(option),
              },
        ]),
      ),
    [options],
  );

  const indexById = React.useMemo(
    () => new Map(poll.options.map((option, index) => [option.id, index])),
    [poll.options],
  );

  const getSlots = (day: string): CalendarSlotModel[] =>
    (days.get(day) ?? []).map((optionId) => {
      const index = indexById.get(optionId) ?? -1;
      const vote = editable
        ? formVotes?.[index]?.type
        : ownParticipant
          ? getVote(ownParticipant.id, optionId)
          : undefined;
      return {
        optionId,
        label: labels.get(optionId)?.label ?? null,
        range: labels.get(optionId)?.range ?? null,
        optionLabel: labels.get(optionId)?.optionLabel ?? "",
        score: canSeeScores ? getScore(optionId).yes : null,
        vote,
      };
    });

  const onVote = (optionId: string, vote: VoteType) => {
    const index = indexById.get(optionId);
    if (index === undefined) {
      return;
    }
    votingForm.setValue(`votes.${index}`, { optionId, type: vote });
  };

  return {
    locale,
    weekStart,
    today: getCalendarDate(new Date(), viewerTimeZone),
    days: [...days.keys()],
    getSlots,
    onVote,
    editable,
    allowTentativeVotes: poll.allowTentativeVotes,
    ownParticipant,
  };
}
