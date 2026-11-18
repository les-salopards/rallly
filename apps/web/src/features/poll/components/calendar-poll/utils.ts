import { getCalendarDate } from "@/lib/datetime/utils";

/** Calendar dates are `YYYY-MM-DD` and months `YYYY-MM` strings throughout. */

const pad = (value: number) => String(value).padStart(2, "0");

const toMonth = (year: number, monthIndex: number) => {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
};

const parseMonth = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return { year, monthIndex: monthNumber - 1 };
};

/**
 * Groups options under the calendar day they fall on for the viewer, using
 * the same zones as the poll's option labels: all-day options are floating
 * dates read in UTC, time slots are shown in the viewer's zone when the poll
 * has one, and as stored (UTC) when its times are floating.
 */
export function groupOptionsByDay(
  options: { id: string; startTime: Date; duration: number }[],
  zones: { pollTimeZone: string | null; viewerTimeZone: string },
): Map<string, string[]> {
  const days = new Map<string, string[]>();
  const sorted = [...options].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );

  for (const option of sorted) {
    const zone =
      option.duration > 0 && zones.pollTimeZone ? zones.viewerTimeZone : "UTC";
    const day = getCalendarDate(option.startTime, zone);
    const ids = days.get(day);
    if (ids) {
      ids.push(option.id);
    } else {
      days.set(day, [option.id]);
    }
  }

  return days;
}

/** The month of the first day still to come, else of the first day. */
export function getInitialMonth(days: string[], today: string): string {
  const sorted = [...days].sort();
  const day = sorted.find((d) => d >= today) ?? sorted[0] ?? today;
  return day.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const { year, monthIndex } = parseMonth(month);
  return toMonth(year, monthIndex + delta);
}

/** The month's weeks, padded with null outside the month. */
export function getMonthWeeks(
  month: string,
  weekStartsOn: number,
): (string | null)[][] {
  const { year, monthIndex } = parseMonth(month);
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const leading = (firstWeekday - weekStartsOn + 7) % 7;

  const cells: (string | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${month}-${pad(day)}`);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

/** The first `max` items, and how many are left out. */
export function splitVisible<T>(
  items: T[],
  max = 3,
): { visible: T[]; hidden: number } {
  return {
    visible: items.slice(0, max),
    hidden: Math.max(0, items.length - max),
  };
}
