
import React from 'react';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onMouseDown, onKeyDown }) => {
  return (
    <div
      id="panel-resizer"
      className="w-1 hover:cursor-col-resize select-none shrink-0 z-30 flex items-center justify-center -ml-0.5 group outline-none focus:outline-none"
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      role="separator"
      tabIndex={0}
      title="拖动调整大小"
    >
       <div className="w-px h-full bg-slate-200 group-hover:bg-sky-400 transition-colors duration-200"></div>
    </div>
  );
};

export default ResizeHandle;
