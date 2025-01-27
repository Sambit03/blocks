export interface Position {
  x: number;
  y: number;
}

export interface Block {
  id: number;
  type: "aave-supply" | "lido-stake";
  position: Position;
}

export interface BlockType {
  id: "aave-supply" | "lido-stake";
  name: string;
}
