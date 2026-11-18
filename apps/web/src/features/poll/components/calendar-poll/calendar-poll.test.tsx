import { fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { CalendarPoll } from "./calendar-poll";

const config = { locale: "en", timeZone: "Europe/Paris", weekStart: 1 };

vi.mock("@/lib/datetime/client", () => ({
  useDateTimeConfig: () => config,
}));
vi.mock("@/components/clock", () => ({ TimesShownIn: () => null }));
vi.mock("@/features/poll/components/voting-footer", () => ({
  VotingFooter: () => <button type="submit">Continue</button>,
}));
vi.mock("@/features/user/client", () => ({
  useUser: () => ({ ownsObject: () => false }),
}));
vi.mock("@/features/poll/client", () => ({
  useParticipants: () => ({ participants: [] }),
  usePermissions: () => ({
    canAddNewParticipant: true,
    canEditParticipant: () => false,
  }),
  useRole: () => "participant",
}));

const pollOptions = [
  { id: "o1", startTime: new Date("2026-11-25T08:00:00Z"), duration: 60 },
  { id: "o2", startTime: new Date("2026-11-25T10:00:00Z"), duration: 60 },
];

vi.mock("@/features/poll/components/poll-context", () => ({
  usePoll: () => ({
    poll: {
      options: pollOptions,
      timeZone: "Europe/Paris",
      allowTentativeVotes: true,
    },
    getScore: () => ({ yes: 3, ifNeedBe: 0, no: 0, skip: 0 }),
    getVote: () => undefined,
  }),
  useOptions: () => ({
    pollType: "timeSlot",
    options: [
      {
        type: "timeSlot",
        optionId: "o1",
        dow: "Wed",
        day: "25",
        month: "Nov",
        year: "2026",
        startTime: "9:00",
        endTime: "10:00",
        duration: "1h",
      },
      {
        type: "timeSlot",
        optionId: "o2",
        dow: "Wed",
        day: "25",
        month: "Nov",
        year: "2026",
        startTime: "11:00",
        endTime: "12:00",
        duration: "1h",
      },
    ],
  }),
}));

// The real hook only adds helpers on top of the form context.
vi.mock("@/features/poll/components/voting-form", () => ({
  useVotingForm: () => {
    const form = useFormContext();
    return {
      ...form,
      cancel: () => form.setValue("mode", "view"),
      newParticipant: () => form.setValue("mode", "new"),
      setEditingParticipantId: () => form.setValue("mode", "edit"),
    };
  },
}));

type FormValues = {
  mode: "new" | "edit" | "view";
  participantId?: string;
  votes: { optionId: string; type?: string }[];
};

let form: ReturnType<typeof useForm<FormValues>>;

function Harness({ mode }: { mode: FormValues["mode"] }) {
  form = useForm<FormValues>({
    defaultValues: {
      mode,
      votes: pollOptions.map((option) => ({ optionId: option.id })),
    },
  });
  return (
    <FormProvider {...form}>
      <CalendarPoll />
    </FormProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-18T12:00:00Z"));
  config.weekStart = 1;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CalendarPoll", () => {
  it("writes a vote into the voting form the table reads", () => {
    render(<Harness mode="new" />);

    fireEvent.click(screen.getByTitle("9:00 – 10:00"));

    expect(form.getValues("votes.0")).toEqual({ optionId: "o1", type: "yes" });
    expect(form.getValues("votes.1")).toEqual({ optionId: "o2" });
  });

  it("names each slot with its date, its vote and its score", () => {
    render(<Harness mode="new" />);

    const slot = screen.getByRole("button", { name: /9:00 – 10:00/ });

    expect(slot.getAttribute("aria-label")).toMatch(/Wed 25 Nov 2026/);
    expect(slot.getAttribute("aria-label")).toMatch(/3/);
  });

  it("offers Cancel while a new response is being entered", () => {
    render(<Harness mode="new" />);

    fireEvent.click(screen.getByRole("button", { name: /Cancel/ }));

    expect(form.getValues("mode")).toBe("view");
  });

  it("starts the week on the viewer's preferred day, not the locale's", () => {
    // English weeks start on Sunday; the viewer chose Monday.
    config.weekStart = 1;
    render(<Harness mode="view" />);

    const headers = screen.getAllByTitle(/day$/);

    expect(headers[0].getAttribute("title")).toBe("Monday");
  });
});
