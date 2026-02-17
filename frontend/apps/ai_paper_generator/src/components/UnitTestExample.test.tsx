import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UnitTestExample } from "./UnitTestExample";

describe("UnitTestExample", () => {
  it("renders correctly", () => {
    render(<UnitTestExample />);
    expect(screen.getByText("Unit Test Example")).toBeInTheDocument();
  });

  it("increments counter on click", () => {
    render(<UnitTestExample />);

    const button = screen.getByText("Increment");
    const countDisplay = screen.getByTestId("count-display");

    expect(countDisplay).toHaveTextContent("Count: 0");

    fireEvent.click(button);

    expect(countDisplay).toHaveTextContent("Count: 1");
  });
});
