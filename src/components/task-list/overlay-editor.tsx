import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./task-list-table.module.css";
import { VisibleField } from "../../types/public-types";

type EditingState = {
  mode: "viewing" | "selected" | "editing";
  rowId: string | null;
  columnId: VisibleField | null;
};

type OverlayRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type OverlayEditorProps = {
  editingState: EditingState;
  taskListRef: React.RefObject<HTMLDivElement>;
  headerContainerRef?: React.RefObject<HTMLDivElement>;
  bodyContainerRef?: React.RefObject<HTMLDivElement>;
  onRequestClose: () => void;
};

const escapeSelectorValue = (value: string) => {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  const sanitized = value.replace(new RegExp(String.fromCharCode(0), "g"), "\uFFFD");
  return Array.from(sanitized)
    .map((char, index) => {
      const codePoint = char.codePointAt(0);
      if (codePoint === undefined) {
        return "";
      }
      if (char === "\u0000") {
        return "\uFFFD";
      }
      if (
        (codePoint >= 0x1 && codePoint <= 0x1f) ||
        codePoint === 0x7f ||
        (index === 0 && codePoint >= 0x30 && codePoint <= 0x39) ||
        (index === 1 &&
          codePoint >= 0x30 &&
          codePoint <= 0x39 &&
          sanitized.charCodeAt(0) === 0x2d)
      ) {
        return `\\${codePoint.toString(16)} `;
      }
      if (char === "-" || char === "_" || /[a-zA-Z0-9]/.test(char)) {
        return char;
      }
      return `\\${char}`;
    })
    .join("");
};

export const OverlayEditor: React.FC<OverlayEditorProps> = ({
  editingState,
  taskListRef,
  headerContainerRef,
  bodyContainerRef,
  onRequestClose,
}) => {
  const [rect, setRect] = useState<OverlayRect | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const portalRoot = useMemo(() => {
    if (typeof document === "undefined") {
      return null;
    }
    return document.body;
  }, []);

  const findTargetElement = useCallback(() => {
    if (!taskListRef.current || !editingState.rowId || !editingState.columnId) {
      return null;
    }
    const rowId = escapeSelectorValue(editingState.rowId);
    const columnId = escapeSelectorValue(editingState.columnId);
    return taskListRef.current.querySelector<HTMLElement>(
      `[data-row-id="${rowId}"][data-column-id="${columnId}"]`
    );
  }, [editingState.columnId, editingState.rowId, taskListRef]);

  const updateRect = useCallback(() => {
    if (editingState.mode !== "editing") {
      setRect(null);
      setTargetElement(null);
      return;
    }
    const target = findTargetElement();
    if (!target) {
      setRect(null);
      setTargetElement(null);
      onRequestClose();
      return;
    }
    if (targetElement !== target) {
      setTargetElement(target);
    }
    const nextRect = target.getBoundingClientRect();
    setRect({
      top: Math.round(nextRect.top),
      left: Math.round(nextRect.left),
      width: Math.round(nextRect.width),
      height: Math.round(nextRect.height),
    });
  }, [editingState.mode, findTargetElement, onRequestClose, targetElement]);

  const scheduleRectUpdate = useCallback(() => {
    if (rafIdRef.current !== null) {
      return;
    }
    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null;
      updateRect();
    });
  }, [updateRect]);

  useEffect(() => {
    if (editingState.mode !== "editing") {
      setRect(null);
      setTargetElement(null);
      return;
    }
    scheduleRectUpdate();
  }, [editingState.mode, scheduleRectUpdate]);

  useEffect(() => {
    if (editingState.mode !== "editing") {
      return undefined;
    }
    const handleScroll = () => scheduleRectUpdate();
    const handleResize = () => scheduleRectUpdate();
    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", handleResize, { capture: true });
    document.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });
    const scrollTargets = [
      taskListRef.current,
      bodyContainerRef?.current,
      headerContainerRef?.current,
    ].filter(Boolean);
    scrollTargets.forEach(element =>
      (element as HTMLElement).addEventListener("scroll", handleScroll, {
        capture: true,
        passive: true,
      })
    );
    const ResizeObserverConstructor =
      typeof window !== "undefined"
        ? (
            window as typeof window & {
              ResizeObserver?: new (callback: (entries: Array<{ target: Element }>) => void) => {
                observe: (target: Element) => void;
                disconnect: () => void;
              };
            }
          ).ResizeObserver
        : undefined;
    const resizeObserver = ResizeObserverConstructor
      ? new ResizeObserverConstructor(() => scheduleRectUpdate())
      : null;
    const observedElements = [
      targetElement,
      taskListRef.current,
      bodyContainerRef?.current,
      headerContainerRef?.current,
    ].filter(Boolean);
    observedElements.forEach(element =>
      resizeObserver?.observe(element as HTMLElement)
    );
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleResize, { capture: true });
      document.removeEventListener("scroll", handleScroll, { capture: true });
      scrollTargets.forEach(element =>
        (element as HTMLElement).removeEventListener("scroll", handleScroll, {
          capture: true,
        })
      );
      resizeObserver?.disconnect();
    };
  }, [
    bodyContainerRef,
    editingState.mode,
    headerContainerRef,
    scheduleRectUpdate,
    targetElement,
    taskListRef,
  ]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  if (editingState.mode !== "editing" || !rect || !portalRoot) {
    return null;
  }

  return createPortal(
    <div
      className={styles.overlayEditor}
      data-testid="overlay-editor"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    >
      <input
        className={styles.taskListInput}
        data-testid="overlay-editor-input"
        type="text"
        aria-label="セル編集"
        defaultValue=""
        style={{ height: "100%" }}
      />
    </div>,
    portalRoot
  );
};
