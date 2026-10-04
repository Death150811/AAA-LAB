import type { Block } from "@/content/types";
import { BlockView } from "./BlockView";

export async function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </>
  );
}
