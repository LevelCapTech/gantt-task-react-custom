import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OverlayEditor } from "../components/task-list/overlay-editor";
import { VisibleField } from "../types/public-types";

const editingState = {
  mode: "editing" as const,
  rowId: "task-1",
  columnId: "name" as VisibleField,
};

const createRefs = () => ({
  taskListRef: React.createRef<HTMLDivElement>(),
  headerRef: React.createRef<HTMLDivElement>(),
  bodyRef: React.createRef<HTMLDivElement>(),
});

const rect = {
  top: 12,
  left: 24,
  width: 180,
  height: 32,
  bottom: 44,
  right: 204,
  x: 24,
  y: 12,
  toJSON: () => ({}),
};

describe("OverlayEditor", () => {
  it("renders overlay in a portal aligned to the cell rect", async () => {
    const rectSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue(rect as DOMRect);
    const rafSpy = jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation(callback => {
        callback(0);
        return 1;
      });
    const { taskListRef, headerRef, bodyRef } = createRefs();

    const { container } = render(
      <div ref={taskListRef}>
        <div ref={headerRef} />
        <div ref={bodyRef}>
          <div data-row-id="task-1" data-column-id="name">
            Task
          </div>
        </div>
        <OverlayEditor
          editingState={editingState}
          taskListRef={taskListRef}
          headerContainerRef={headerRef}
          bodyContainerRef={bodyRef}
          onRequestClose={jest.fn()}
        />
      </div>
    );

    const overlay = await screen.findByTestId("overlay-editor");

    expect(overlay).toHaveStyle({
      top: "12px",
      left: "24px",
      width: "180px",
      height: "32px",
    });
    expect(container).not.toContainElement(overlay);

    rectSpy.mockRestore();
    rafSpy.mockRestore();
  });

  it("requests close when the target cell is missing", async () => {
    const rectSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue(rect as DOMRect);
    const rafSpy = jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation(callback => {
        callback(0);
        return 1;
      });
    const onRequestClose = jest.fn();
    const { taskListRef, headerRef, bodyRef } = createRefs();

    render(
      <div ref={taskListRef}>
        <div ref={headerRef} />
        <div ref={bodyRef} />
        <OverlayEditor
          editingState={editingState}
          taskListRef={taskListRef}
          headerContainerRef={headerRef}
          bodyContainerRef={bodyRef}
          onRequestClose={onRequestClose}
        />
      </div>
    );

    await waitFor(() => expect(onRequestClose).toHaveBeenCalled());
    expect(screen.queryByTestId("overlay-editor")).toBeNull();

    rectSpy.mockRestore();
    rafSpy.mockRestore();
  });

  it("batches rect updates with requestAnimationFrame", async () => {
    const rectSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue(rect as DOMRect);
    const callbacks: FrameRequestCallback[] = [];
    const rafSpy = jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation(callback => {
        callbacks.push(callback);
        return callbacks.length;
      });
    const { taskListRef, headerRef, bodyRef } = createRefs();

    render(
      <div ref={taskListRef}>
        <div ref={headerRef} />
        <div ref={bodyRef}>
          <div data-row-id="task-1" data-column-id="name">
            Task
          </div>
        </div>
        <OverlayEditor
          editingState={editingState}
          taskListRef={taskListRef}
          headerContainerRef={headerRef}
          bodyContainerRef={bodyRef}
          onRequestClose={jest.fn()}
        />
      </div>
    );

    await waitFor(() => expect(rafSpy).toHaveBeenCalledTimes(1));

    for (let i = 0; i < 3; i += 1) {
      fireEvent.scroll(window);
    }

    expect(rafSpy).toHaveBeenCalledTimes(1);
    callbacks.forEach(callback => callback(0));

    rectSpy.mockRestore();
    rafSpy.mockRestore();
  });
});
