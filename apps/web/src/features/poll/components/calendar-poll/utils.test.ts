import {
  findViewerParticipant,
  getInitialMonth,
  getMonthWeeks,
  groupOptionsByDay,
  shiftMonth,
  splitVisible,
} from "./utils";

const option = (id: string, startTime: string, duration: number) => ({
  id,
  startTime: new Date(startTime),
  duration,
});

describe("groupOptionsByDay", () => {
  it("keeps an all-day option on its UTC date whatever the viewer's zone", () => {
    const days = groupOptionsByDay([option("a", "2026-11-24T00:00:00Z", 0)], {
      pollTimeZone: null,
      viewerTimeZone: "America/Los_Angeles",
    });

    expect([...days.entries()]).toEqual([["2026-11-24", ["a"]]]);
  });

  it("moves a late UTC time slot to the next day in the viewer's zone", () => {
    const days = groupOptionsByDay([option("a", "2026-11-24T23:30:00Z", 60)], {
      pollTimeZone: "Europe/Paris",
      viewerTimeZone: "Europe/Paris",
    });

    expect([...days.entries()]).toEqual([["2026-11-25", ["a"]]]);
  });

  it("reads floating time slots in UTC", () => {
    const days = groupOptionsByDay([option("a", "2026-11-24T23:30:00Z", 60)], {
      pollTimeZone: null,
      viewerTimeZone: "Europe/Paris",
    });

    expect([...days.entries()]).toEqual([["2026-11-24", ["a"]]]);
  });

  it("orders a day's options by start time", () => {
    const days = groupOptionsByDay(
      [
        option("late", "2026-11-24T16:00:00Z", 60),
        option("early", "2026-11-24T09:00:00Z", 60),
        option("mid", "2026-11-24T12:00:00Z", 60),
      ],
      { pollTimeZone: "UTC", viewerTimeZone: "UTC" },
    );

    expect(days.get("2026-11-24")).toEqual(["early", "mid", "late"]);
  });
});

describe("getInitialMonth", () => {
  it("opens on the month of the first upcoming day", () => {
    expect(
      getInitialMonth(["2026-10-02", "2026-11-20", "2026-12-03"], "2026-11-18"),
    ).toBe("2026-11");
  });

  it("falls back to the first day when every day has passed", () => {
    expect(getInitialMonth(["2026-10-02"], "2026-11-18")).toBe("2026-10");
  });

  it("opens on today's month when there are no days", () => {
    expect(getInitialMonth([], "2026-11-18")).toBe("2026-11");
  });
});

describe("getMonthWeeks", () => {
  it("lays November 2026 out on Monday-first weeks", () => {
    const weeks = getMonthWeeks("2026-11", 1);

    expect(weeks).toHaveLength(6);
    expect(weeks[0]).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      "2026-11-01",
    ]);
    expect(weeks[5][0]).toBe("2026-11-30");
    expect(weeks[5].slice(1)).toEqual([null, null, null, null, null, null]);
  });

  it("starts the first Sunday-first week on November 1st", () => {
    expect(getMonthWeeks("2026-11", 0)[0][0]).toBe("2026-11-01");
  });
});

describe("shiftMonth", () => {
  it("rolls over into the next year", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  it("rolls back into the previous year", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});

describe("splitVisible", () => {
  it("shows three items and counts the rest", () => {
    expect(splitVisible([1, 2, 3, 4, 5])).toEqual({
      visible: [1, 2, 3],
      hidden: 2,
    });
  });

  it("shows everything when there are three or fewer", () => {
    expect(splitVisible([1, 2])).toEqual({ visible: [1, 2], hidden: 0 });
  });
});

describe("findViewerParticipant", () => {
  const participants = [
    { id: "bob", userId: "user-bob" },
    { id: "alice", userId: "user-alice" },
  ];

  it("finds the response the viewer's account owns", () => {
    expect(
      findViewerParticipant(participants, {
        role: "participant",
        owns: (p) => p.userId === "user-alice",
        canEdit: () => false,
      })?.id,
    ).toBe("alice");
  });

  it("finds a response opened through its edit link", () => {
    expect(
      findViewerParticipant(participants, {
        role: "participant",
        owns: () => false,
        canEdit: (id) => id === "bob",
      })?.id,
    ).toBe("bob");
  });

  it("never hands an admin someone else's response", () => {
    expect(
      findViewerParticipant(participants, {
        role: "admin",
        owns: () => false,
        canEdit: () => true,
      }),
    ).toBeUndefined();
  });
});
