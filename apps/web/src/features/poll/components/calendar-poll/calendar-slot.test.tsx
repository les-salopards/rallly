import { fireEvent, render, screen } from "@testing-library/react";
import { CalendarSlot } from "./calendar-slot";

const renderSlot = (
  props: Partial<React.ComponentProps<typeof CalendarSlot>> = {},
) => {
  const onChange = vi.fn();
  render(
    <CalendarSlot
      label="10:00"
      score={3}
      vote="yes"
      editable
      allowTentativeVotes
      onChange={onChange}
      {...props}
    />,
  );
  return { onChange, button: screen.getByRole("button") };
};

describe("CalendarSlot", () => {
  it("moves a yes to if need be on click", () => {
    const { onChange, button } = renderSlot();

    fireEvent.click(button);

    expect(onChange).toHaveBeenCalledWith("ifNeedBe");
  });

  it("skips if need be when the poll does not allow it", () => {
    const { onChange, button } = renderSlot({ allowTentativeVotes: false });

    fireEvent.click(button);

    expect(onChange).toHaveBeenCalledWith("no");
  });

  it("does nothing when the response is not being edited", () => {
    const { onChange, button } = renderSlot({ editable: false });

    fireEvent.click(button);

    expect(button).toHaveProperty("disabled", true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows the slot's label and score", () => {
    const { button } = renderSlot();

    expect(button.textContent).toContain("10:00");
    expect(button.textContent).toContain("3");
  });

  it("hides the score when the poll hides scores", () => {
    const { button } = renderSlot({ score: null });

    expect(button.textContent).toContain("10:00");
    expect(button.textContent).not.toContain("3");
  });

  it("exposes the full time range on hover", () => {
    const { button } = renderSlot({ label: "10:00", title: "10:00 – 11:00" });

    expect(button.getAttribute("title")).toBe("10:00 – 11:00");
  });
});
