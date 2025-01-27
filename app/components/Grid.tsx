import { useDrop } from "react-dnd";
import Block from "./Block";
import { Block as BlockInterface, Position } from "../types";
import { useRef } from "react";

interface GridProps {
  blocks: BlockInterface[];
  onMoveBlock: (id: number, position: Position) => void;
  onRemoveBlock: (id: number) => void;
}

interface DragItem extends BlockInterface {
  position: Position;
}

const Grid = ({ blocks, onMoveBlock, onRemoveBlock }: GridProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: "block",
    drop: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        const x = Math.round((item.position.x + delta.x) / 20) * 20;
        const y = Math.round((item.position.y + delta.y) / 20) * 20;
        onMoveBlock(item.id, { x, y });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(ref);

  return (
    <div ref={ref} className="flex-1 min-h-[600px] bg-gray-50 rounded relative">
      {blocks.map((block) => (
        <Block
          key={block.id}
          {...block}
          onRemove={() => onRemoveBlock(block.id)}
        />
      ))}
    </div>
  );
};

export default Grid;
