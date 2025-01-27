import { useDrag } from "react-dnd";
import { XCircle } from "lucide-react";
import { Block as BlockInterface, Position } from "../types";
import AAVESupplyContent from "./protocol/AAVESupplyContent";

interface BlockProps extends Omit<BlockInterface, "position"> {
  position: Position;
  onRemove: () => void;
}

const Block = ({ id, type, position, onRemove }: BlockProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "block",
    item: { id, type, position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const blockStyles: React.CSSProperties = {
    position: "absolute",
    left: position.x,
    top: position.y,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={drag as unknown as React.RefObject<HTMLDivElement>}
      style={blockStyles}
      className="w-64 bg-white p-4 rounded shadow cursor-move"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">
          {type === "aave-supply" ? "AAVE Supply" : "Lido Stake & Wrap"}
        </h3>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-gray-600"
        >
          <XCircle size={20} />
        </button>
      </div>
      {type === "aave-supply" ? <AAVESupplyContent /> : <LidoStakeContent />}
    </div>
  );
};

export default Block;
