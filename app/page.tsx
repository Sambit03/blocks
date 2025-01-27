"use client";
import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import Grid from "./components/Grid";
import BlockPalette from "./components/BlockPalette";
import { Block, Position } from "./types";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect(); // Remove the connector config here

  const handleConnect = async () => {
    connect({ connector: injected() });
  };

  const [blocks, setBlocks] = useState<Block[]>([]);

  const handleAddBlock = (blockType: Block["type"]) => {
    const newBlock: Block = {
      id: Date.now(),
      type: blockType,
      position: { x: 0, y: 0 },
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleRemoveBlock = (blockId: number) => {
    setBlocks(blocks.filter((block) => block.id !== blockId));
  };

  const handleMoveBlock = (blockId: number, position: Position) => {
    setBlocks(
      blocks.map((block) =>
        block.id === blockId ? { ...block, position } : block
      )
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <main className="min-h-screen p-8">
        <div className="mb-8">
          {!isConnected ? (
            <button
              onClick={handleConnect} // Updated to use the new handler
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="text-sm text-gray-600">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          )}
        </div>

        <div className="flex gap-8">
          <BlockPalette onAddBlock={handleAddBlock} />
          <Grid
            blocks={blocks}
            onMoveBlock={handleMoveBlock}
            onRemoveBlock={handleRemoveBlock}
          />
        </div>
      </main>
    </DndProvider>
  );
}
