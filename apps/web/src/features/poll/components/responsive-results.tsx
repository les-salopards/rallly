"use client";

import { Card } from "@rallly/ui/card";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@rallly/ui/segmented-control";
import { CalendarDaysIcon, TableIcon } from "lucide-react";
import * as React from "react";
import { createBreakpoint } from "react-use";
import { CalendarPoll } from "@/features/poll/components/calendar-poll/calendar-poll";
import DesktopPoll from "@/features/poll/components/desktop-poll";
import MobilePoll from "@/features/poll/components/mobile-poll";
import { usePoll } from "@/features/poll/components/poll-context";
import { PollOutcome } from "@/features/poll/components/poll-outcome";
import { useTranslation } from "@/i18n/client";

const useBreakpoint = createBreakpoint({ list: 320, table: 640 });

type ResultsView = "table" | "calendar";

export function ResponsiveResults() {
  const { t } = useTranslation();
  const { poll } = usePoll();
  const breakpoint = useBreakpoint();
  // The table stays the default; the calendar answers into the same form.
  const [view, setView] = React.useState<ResultsView>("table");
  const PollComponent = breakpoint === "table" ? DesktopPoll : MobilePoll;
  const hasOptions = poll.options.length > 0;

  return (
    <PollOutcome frame={Card}>
      {hasOptions ? (
        <div className="mb-2 flex justify-end">
          <SegmentedControl
            aria-label={t("calendarViewSwitcher", { defaultValue: "View" })}
            value={view}
            onValueChange={(value) => {
              if (value) {
                setView(value as ResultsView);
              }
            }}
          >
            <SegmentedControlItem value="table" className="gap-1.5 px-2.5">
              <TableIcon />
              {t("calendarViewTable", { defaultValue: "Table" })}
            </SegmentedControlItem>
            <SegmentedControlItem value="calendar" className="gap-1.5 px-2.5">
              <CalendarDaysIcon />
              {t("calendarViewCalendar", { defaultValue: "Calendar" })}
            </SegmentedControlItem>
          </SegmentedControl>
        </div>
      ) : null}
      {hasOptions && view === "calendar" ? (
        <Card>
          <CalendarPoll />
        </Card>
      ) : (
        <PollComponent />
      )}
    </PollOutcome>
  );
}
