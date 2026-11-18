"use client";

import { Button } from "@rallly/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "@/i18n/client";
import { formatDate } from "@/lib/datetime/format";
import { getLocaleDefaults, getWeekdayNames } from "@/lib/datetime/locales";
import { CalendarDay } from "./calendar-day";
import { useCalendarModel } from "./use-calendar-model";
import { getInitialMonth, getMonthWeeks, shiftMonth } from "./utils";

/**
 * A month grid of the poll's options. Responding here writes the same
 * voting form as the table, so switching views never loses a vote.
 */
export function CalendarPoll() {
  const { t } = useTranslation();
  const model = useCalendarModel();
  const { locale } = model;
  const [month, setMonth] = React.useState(() =>
    getInitialMonth(model.days, model.today),
  );

  const weekStart = getLocaleDefaults(locale).weekStart;
  const weeks = getMonthWeeks(month, weekStart);
  const weekdays = getWeekdayNames(locale);

  return (
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
            {week.map((date, index) => (
              <CalendarDay
                key={date ?? `pad-${index}`}
                date={date}
                dayLabel={
                  date
                    ? formatDate(new Date(`${date}T00:00:00Z`), {
                        preset: "weekdayMonthDay",
                        locale,
                      })
                    : ""
                }
                slots={date ? model.getSlots(date) : []}
                editable={model.editable}
                allowTentativeVotes={model.allowTentativeVotes}
                onVote={model.onVote}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
