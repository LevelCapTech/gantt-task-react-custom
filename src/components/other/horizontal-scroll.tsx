import React, { SyntheticEvent, useRef, useEffect } from "react";
import styles from "./horizontal-scroll.module.css";

export const HorizontalScroll: React.FC<{
  scroll: number;
  svgWidth: number;
  rtl: boolean;
  onScroll: (event: SyntheticEvent<HTMLDivElement>) => void;
  "data-testid"?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
}> = ({ scroll, svgWidth, rtl, onScroll, "data-testid": dataTestId, containerRef }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = containerRef ?? scrollRef;

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollLeft = scroll;
    }
  }, [scroll, wrapperRef]);

  return (
    <div
      dir="ltr"
      className={styles.scrollWrapper}
      onScroll={onScroll}
      ref={wrapperRef}
      data-testid={dataTestId}
    >
      <div style={{ width: svgWidth }} className={styles.scroll} />
    </div>
  );
};
