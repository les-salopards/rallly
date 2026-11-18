"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { createBreakpoint } from "react-use";
import { TimesShownIn } from "@/components/clock";
import { usePoll } from "@/features/poll/components/poll-context";
import { useTranslation } from "@/i18n/client";
import { formatDate } from "@/lib/datetime/format";
import { getWeekdayNames } from "@/lib/datetime/locales";
import { CalendarDay, CalendarSlotList } from "./calendar-day";
import { CalendarResponseControls } from "./calendar-response-controls";
import { useCalendarModel } from "./use-calendar-model";
import { getInitialMonth, getMonthWeeks, shiftMonth } from "./utils";

// Same breakpoint as ResponsiveResults: the full grid needs table width.
const useBreakpoint = createBreakpoint({ compact: 320, grid: 640 });

const formatDay = (date: string, locale: string) =>
  formatDate(new Date(`${date}T00:00:00Z`), {
    preset: "weekdayMonthDay",
    locale,
  });

/**
 * A month grid of the poll's options. Responding here writes the same
 * voting form as the table, so switching views never loses a vote. Below
 * table width the grid only marks the offered days, and the selected day's
 * slots are listed underneath.
 */
export function CalendarPoll() {
  const { t } = useTranslation();
  const { poll } = usePoll();
  const model = useCalendarModel();
  const { locale } = model;
  const compact = useBreakpoint() !== "grid";
  const [month, setMonth] = React.useState(() =>
    getInitialMonth(model.days, model.today),
  );
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);

  // The viewer's week start (their preference, else their locale's).
  const weeks = getMonthWeeks(month, model.weekStart);
  const weekdays = [...getWeekdayNames(locale)].sort(
    (a, b) =>
      ((a.day - model.weekStart + 7) % 7) - ((b.day - model.weekStart + 7) % 7),
  );
  const offeredDays = new Set(model.days);
  // Compact view: the picked day, else the month's first offered day.
  const activeDay =
    selectedDay?.startsWith(month) && offeredDays.has(selectedDay)
      ? selectedDay
      : (model.days.find((day) => day.startsWith(month)) ?? null);
  const handlers = {
    editable: model.editable,
    allowTentativeVotes: model.allowTentativeVotes,
    onVote: model.onVote,
  };

  return (
    <>
      {poll.options[0]?.duration !== 0 && poll.timeZone ? (
        <div className="border-b p-2">
          <TimesShownIn />
        </div>
      ) : null}
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("calendarPreviousMonth", {
              defaultValue: "Previous month",
            })}
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
          >
            <ChevronLeftIcon />
          </Button>
          <h3 className="font-semibold text-sm capitalize">
            {formatDate(new Date(`${month}-01T00:00:00Z`), {
              preset: "monthYear",
              locale,
            })}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("calendarNextMonth", { defaultValue: "Next month" })}
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <div className="flex gap-1.5">
          {weekdays.map((weekday) => (
            <span
              key={weekday.day}
              title={weekday.label}
              className="flex-1 basis-0 text-center text-muted-foreground text-xs"
            >
              {weekday.short}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          {weeks.map((week) => (
            <div key={week.find(Boolean) ?? ""} className="flex gap-1.5">
              {week.map((date, index) => {
                const key = date ?? `pad-${index}`;
                if (!compact) {
                  return (
                    <CalendarDay
                      key={key}
                      date={date}
                      dayLabel={date ? formatDay(date, locale) : ""}
                      slots={date ? model.getSlots(date) : []}
                      {...handlers}
                    />
                  );
                }
                if (!date) {
                  return <div key={key} className="flex-1 basis-0" />;
                }
                const offered = offeredDays.has(date);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!offered}
                    aria-pressed={date === activeDay}
                    aria-label={formatDay(date, locale)}
                    onClick={() => setSelectedDay(date)}
                    className={cn(
                      "flex h-11 flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-md text-sm tabular-nums",
                      offered
                        ? "cursor-pointer font-medium hover:bg-muted"
                        : "text-muted-foreground",
                      date === activeDay &&
                        "bg-primary text-primary-foreground hover:bg-primary",
                    )}
                  >
                    {Number(date.slice(8))}
                    <span
                      className={cn(
                        "size-1 rounded-full",
                        offered ? "bg-current" : "bg-transparent",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {compact && activeDay ? (
          <div className="flex flex-col gap-2 border-t pt-3">
            <p className="font-medium text-sm">
              {formatDay(activeDay, locale)}
            </p>
            <CalendarSlotList
              slots={model.getSlots(activeDay)}
              full
              {...handlers}
            />
          </div>
        ) : null}
      </div>
      <CalendarResponseControls />
    </>
  );
}
