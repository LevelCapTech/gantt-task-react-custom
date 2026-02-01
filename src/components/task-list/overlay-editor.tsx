import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./task-list-table.module.css";
import {
  TASK_PROCESS_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "../../constants/taskOptions";
import { CellCommitTrigger, VisibleField } from "../../types/public-types";

type EditingState = {
  mode: "viewing" | "selected" | "editing";
  rowId: string | null;
  columnId: VisibleField | null;
  pending: boolean;
  errorMessage: string | null;
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
  onCommit: (value: string, trigger: CellCommitTrigger) => Promise<void>;
  onCancel: (reason: "escape" | "nochange-blur" | "unmounted") => void;
};

type OverlayInputType = "text" | "date" | "number" | "select";

const NULL_CHAR_REGEX = new RegExp(String.fromCharCode(0), "g");
const ALPHANUMERIC_REGEX = /[a-zA-Z0-9]/;

const resolveOverlayInputType = (
  columnId: VisibleField | null
): OverlayInputType => {
  switch (columnId) {
    case "start":
    case "end":
    case "plannedStart":
    case "plannedEnd":
      return "date";
    case "plannedEffort":
    case "actualEffort":
      return "number";
    case "process":
    case "status":
      return "select";
    case "name":
    case "assignee":
    default:
      return "text";
  }
};

const escapeSelectorValue = (value: string) => {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  const sanitized = value.replace(NULL_CHAR_REGEX, "\uFFFD");
  return Array.from(sanitized)
    .map((char, index) => {
      const codePoint = char.codePointAt(0);
      if (codePoint === undefined) {
        return "";
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
      if (char === "-" || char === "_" || ALPHANUMERIC_REGEX.test(char)) {
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
  onCommit,
  onCancel,
}) => {
  const [rect, setRect] = useState<OverlayRect | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);
  const defaultValueRef = useRef("");
  const compositionRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const inputType = useMemo(
    () => resolveOverlayInputType(editingState.columnId),
    [editingState.columnId]
  );
  const selectOptions = useMemo<readonly string[]>(() => {
    if (editingState.columnId === "process") {
      return TASK_PROCESS_OPTIONS;
    }
    if (editingState.columnId === "status") {
      return TASK_STATUS_OPTIONS;
    }
    return [];
  }, [editingState.columnId]);

  const portalRoot = useMemo(() => {
    if (typeof document === "undefined") {
      return null;
    }
    return document.body;
  }, []);

  const resolveDefaultValue = useCallback((target: HTMLElement) => {
    const input = target.querySelector("input, textarea, select");
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      return input.value;
    }
    if (input instanceof HTMLSelectElement) {
      return input.value;
    }
    return (target.textContent ?? "").trim();
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
      onCancel("unmounted");
      return;
    }
    if (targetElement !== target) {
      const nextDefaultValue = resolveDefaultValue(target);
      defaultValueRef.current = nextDefaultValue;
      if (inputRef.current) {
        inputRef.current.value = nextDefaultValue;
      }
      setTargetElement(target);
    }
    const nextRect = target.getBoundingClientRect();
    setRect({
      top: Math.round(nextRect.top),
      left: Math.round(nextRect.left),
      width: Math.round(nextRect.width),
      height: Math.round(nextRect.height),
    });
  }, [
    editingState.mode,
    findTargetElement,
    onCancel,
    resolveDefaultValue,
    targetElement,
  ]);

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
      defaultValueRef.current = "";
      compositionRef.current = false;
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

  useEffect(() => {
    if (editingState.mode !== "editing") {
      return;
    }
    const input = inputRef.current;
    if (!input) {
      return;
    }
    if (editingState.pending) {
      input.focus();
      return;
    }
    input.focus();
    if (input instanceof HTMLInputElement) {
      input.select();
    }
  }, [editingState.mode, editingState.pending, targetElement]);

  const handleCommit = useCallback(async () => {
    if (editingState.pending) {
      return;
    }
    const input = inputRef.current;
    if (!input) {
      return;
    }
    await onCommit(input.value, "enter");
  }, [editingState.pending, onCommit]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (editingState.pending) {
        if (event.key === "Escape" || event.key === "Enter") {
          event.preventDefault();
        }
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        void handleCommit();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel("escape");
      }
    },
    [editingState.pending, handleCommit, onCancel]
  );

  const handleBlur = useCallback(() => {
    if (editingState.pending || compositionRef.current) {
      return;
    }
    const input = inputRef.current;
    if (!input) {
      return;
    }
    if (input.value === defaultValueRef.current) {
      onCancel("nochange-blur");
    }
  }, [editingState.pending, onCancel]);

  const handleInput = useCallback(
    (event: React.FormEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (!editingState.pending) {
        return;
      }
      const input = event.currentTarget;
      input.value = defaultValueRef.current;
    },
    [editingState.pending]
  );

  const handleCompositionStart = () => {
    compositionRef.current = true;
  };

  const handleCompositionEnd = () => {
    compositionRef.current = false;
  };

  const setInputElement = useCallback(
    (element: HTMLInputElement | HTMLSelectElement | null) => {
      inputRef.current = element;
    },
    []
  );

  if (editingState.mode !== "editing" || !rect || !portalRoot) {
    return null;
  }

  return createPortal(
    <div
      className={`${styles.overlayEditor} ${
        editingState.pending ? styles.overlayEditorPending : ""
      }`}
      data-testid="overlay-editor"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    >
      {inputType === "select" ? (
        <select
          className={styles.taskListSelect}
          data-testid="overlay-editor-input"
          aria-label="セル編集"
          defaultValue={defaultValueRef.current}
          style={{ height: "100%" }}
          ref={setInputElement}
          disabled={editingState.pending}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onInput={handleInput}
          onChange={handleInput}
        >
          {selectOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={styles.taskListInput}
          data-testid="overlay-editor-input"
          type={inputType}
          aria-label="セル編集"
          defaultValue={defaultValueRef.current}
          style={{ height: "100%" }}
          ref={setInputElement}
          readOnly={editingState.pending}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onInput={handleInput}
          onChange={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
        />
      )}
      {editingState.errorMessage && (
        <div className={styles.overlayEditorError} role="alert">
          {editingState.errorMessage}
        </div>
      )}
    </div>,
    portalRoot
  );
};
