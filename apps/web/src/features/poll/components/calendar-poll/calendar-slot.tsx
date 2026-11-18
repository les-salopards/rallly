import { cn } from "@rallly/ui";
import { UsersIcon } from "lucide-react";
import VoteIcon from "@/features/poll/components/vote-icon";
import { toggleVote } from "@/features/poll/components/vote-selector";
import type { VoteType } from "@/features/poll/constants";

/**
 * One option inside a calendar day. While a response is being edited a click
 * moves its vote along the same cycle as the table's vote selector.
 */
export function CalendarSlot({
  label,
  score,
  vote,
  editable,
  allowTentativeVotes,
  onChange,
  className,
}: {
  /** The slot's time range; null for an all-day option. */
  label: string | null;
  /** How many participants said yes. */
  score: number;
  vote?: VoteType;
  editable: boolean;
  allowTentativeVotes: boolean;
  onChange: (vote: VoteType) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={!editable}
      onClick={() => onChange(toggleVote(vote, allowTentativeVotes))}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md border bg-card px-1.5 py-1 text-left text-xs",
        "enabled:cursor-pointer enabled:hover:bg-muted disabled:cursor-default",
        vote === "yes" && "border-green-500/40 bg-green-500/10",
        vote === "ifNeedBe" && "border-amber-500/40 bg-amber-500/10",
        className,
      )}
    >
      <VoteIcon type={vote} size="sm" />
      <span className="min-w-0 flex-1 truncate tabular-nums">{label}</span>
      <span className="inline-flex items-center gap-0.5 text-muted-foreground tabular-nums">
        <UsersIcon className="size-3" />
        {score}
      </span>
    </button>
  );
}
