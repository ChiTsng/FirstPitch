import type { Block, ToolName } from '../content/layers';

export type ReadingBlock = Block | { t: 'rule-continuation'; name: string; blocks: Block[] };

/** Keep authored reading order, including tools nested inside a rule explanation. */
export function chapterSegments(blocks: Block[]) {
  const segments: { blocks: ReadingBlock[]; tool?: ToolName }[] = [];
  let reading: ReadingBlock[] = [];
  const addTool = (name: ToolName) => {
    if (reading.length) segments.push({ blocks: reading });
    segments.push({ blocks: [], tool: name });
    reading = [];
  };
  for (const block of blocks) {
    if (block.t === 'tool') {
      addTool(block.name);
    } else if (block.t === 'hole' && block.rule.some(rule => rule.t === 'tool')) {
      let cursor = 0;
      let first = true;
      block.rule.forEach((rule, i) => {
        if (rule.t !== 'tool') return;
        const before = block.rule.slice(cursor, i);
        if (first) reading.push({ ...block, rule: before });
        else if (before.length) reading.push({ t: 'rule-continuation', name: block.ruleLabel ?? '规则', blocks: before });
        addTool(rule.name);
        cursor = i + 1;
        first = false;
      });
      const rest = block.rule.slice(cursor);
      if (rest.length) reading.push({ t: 'rule-continuation', name: block.ruleLabel ?? '规则', blocks: rest });
    } else reading.push(block);
  }
  if (reading.length) segments.push({ blocks: reading });
  return segments;
}
