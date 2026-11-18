import { cn } from "@rallly/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import type { VoteType } from "@/features/poll/constants";
import { useTranslation } from "@/i18n/client";
import { CalendarSlot } from "./calendar-slot";
import { splitVisible } from "./utils";

export type CalendarSlotModel = {
  optionId: string;
  /** Time range of a time slot; null for an all-day option. */
  label: string | null;
  score: number | null;
  vote?: VoteType;
};

export type CalendarSlotHandlers = {
  editable: boolean;
  allowTentativeVotes: boolean;
  onVote: (optionId: string, vote: VoteType) => void;
};

export function CalendarSlotList({
  slots,
  editable,
  allowTentativeVotes,
  onVote,
}: { slots: CalendarSlotModel[] } & CalendarSlotHandlers) {
  return (
    <div className="flex flex-col gap-1">
      {slots.map((slot) => (
        <CalendarSlot
          key={slot.optionId}
          label={slot.label}
          score={slot.score}
          vote={slot.vote}
          editable={editable}
          allowTentativeVotes={allowTentativeVotes}
          onChange={(vote) => onVote(slot.optionId, vote)}
        />
      ))}
    </div>
  );
}

/**
 * A day of the month grid. Days the poll does not offer are recessed so the
 * votable days stand out; a busy day shows its first slots and folds the rest
 * into a popover listing all of them.
 */
export function CalendarDay({
  date,
  dayLabel,
  slots,
  ...handlers
}: {
  date: string | null;
  /** The day's full date, used as the popover title. */
  dayLabel: string;
  slots: CalendarSlotModel[];
} & CalendarSlotHandlers) {
  const { t } = useTranslation();

  if (!date) {
    return <div aria-hidden className="min-h-24 flex-1 basis-0" />;
  }

  const { visible, hidden } = splitVisible(slots);
  const offered = slots.length > 0;

  return (
    <div
      className={cn(
        "flex min-h-24 min-w-0 flex-1 basis-0 flex-col gap-1 rounded-lg border p-1.5",
        offered ? "bg-card" : "border-dashed bg-muted/40",
      )}
    >
      <span
        className={cn(
          "font-medium text-xs tabular-nums",
          !offered && "text-muted-foreground",
        )}
      >
        {Number(date.slice(8))}
      </span>
      {offered ? <CalendarSlotList slots={visible} {...handlers} /> : null}
      {hidden > 0 ? (
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="cursor-pointer rounded-md px-1 text-left text-muted-foreground text-xs hover:bg-muted hover:text-foreground"
              />
            }
          >
            {t("calendarMoreOptions", {
              defaultValue: "+{count} more",
              count: hidden,
            })}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56">
            <p className="mb-2 font-medium text-sm">{dayLabel}</p>
            <CalendarSlotList slots={slots} {...handlers} />
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}
