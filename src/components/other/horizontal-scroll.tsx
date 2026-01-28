import React, { SyntheticEvent, useRef, useEffect } from "react";
import styles from "./horizontal-scroll.module.css";

export type HorizontalScrollProps = {
  scroll: number;
  svgWidth: number;
  scrollerWidth?: number;
  rtl: boolean;
  onScroll: (event: SyntheticEvent<HTMLDivElement>) => void;
  "data-testid"?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  hidden?: boolean;
};

export const HorizontalScroll: React.FC<HorizontalScrollProps> = ({
  scroll,
  svgWidth,
  scrollerWidth,
  rtl,
  onScroll,
  "data-testid": dataTestId,
  containerRef,
  hidden,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = containerRef ?? scrollRef;

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollLeft = scroll;
    }
  }, [scroll, wrapperRef]);

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className={styles.scrollWrapper}
      onScroll={onScroll}
      ref={wrapperRef}
      data-testid={dataTestId}
      style={hidden ? { display: "none" } : { width: svgWidth }}
    >
      <div style={{ width: scrollerWidth ?? svgWidth }} className={styles.scroll} />
    </div>
  );
};
