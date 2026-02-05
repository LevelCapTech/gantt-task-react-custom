import React, { SyntheticEvent } from "react";
export declare type HorizontalScrollProps = {
    scroll: number;
    svgWidth: number;
    scrollerWidth?: number;
    rtl: boolean;
    onScroll: (event: SyntheticEvent<HTMLDivElement>) => void;
    "data-testid"?: string;
    containerRef?: React.RefObject<HTMLDivElement>;
    hidden?: boolean;
};
export declare const HorizontalScroll: React.FC<HorizontalScrollProps>;
