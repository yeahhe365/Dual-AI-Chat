declare module 'react-virtuoso' {
  import * as React from 'react';

  export interface VirtuosoProps<TItem = any> extends React.HTMLAttributes<HTMLDivElement> {
    /** Array of items to render (virtualized). */
    data: TItem[];
    /** Function that returns JSX for a given item. */
    itemContent: (index: number, item: TItem) => React.ReactNode;
    /** When set to "auto", automatically scrolls to bottom on new items. */
    followOutput?: 'auto' | boolean;
    /** Pass‐through style prop. */
    style?: React.CSSProperties;
    /** Pass‐through className prop. */
    className?: string;
  }

  /** Lightweight type stub for react-virtuoso Virtuoso component. */
  export function Virtuoso<TItem = any>(props: VirtuosoProps<TItem>): JSX.Element;
}
