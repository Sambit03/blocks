import { BlockType } from "../types";

interface BlockPaletteProps {
  onAddBlock: (blockType: BlockType["id"]) => void;
}

const BlockPalette: React.FC<BlockPaletteProps> = ({ onAddBlock }) => {
  const blockTypes: BlockType[] = [
    { id: "aave-supply", name: "AAVE Supply" },
    { id: "lido-stake", name: "Lido Stake & Wrap" },
  ];

  return (
    <div className="w-64 bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Available Blocks</h2>
      <div className="space-y-2">
        {blockTypes.map((block) => (
          <button
            key={block.id}
            onClick={() => onAddBlock(block.id)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded"
          >
            {block.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BlockPalette;
