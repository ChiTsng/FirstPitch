import { describe, expect, it } from 'vitest';
import { LAYERS } from '../content/layers';
import { chapterSegments, type ReadingBlock } from './chapterSegments';

// Compare the whole authored sequence, including tools within rules, with the rendered sequence.
function readingOrder(blocks: ReadingBlock[]): unknown[] {
  return blocks.flatMap(block => {
    if (block.t === 'rule-continuation') return readingOrder(block.blocks);
    if (block.t === 'hole') {
      const { rule, ...heading } = block;
      return [heading, ...readingOrder(rule)];
    }
    return [block];
  });
}

describe('chapter presentation', () => {
  it.each(LAYERS)('preserves every block in authored order for $id', layer => {
    const segments = chapterSegments(layer.blocks);
    const shown = segments.flatMap(segment => segment.tool ? [{ t: 'tool', name: segment.tool }] : readingOrder(segment.blocks));
    expect(shown).toEqual(readingOrder(layer.blocks));
    // Every simulator gets its own full-width segment, never a narrow prose container.
    for (const segment of segments) {
      expect(readingOrder(segment.blocks).some(block => (block as {t:string}).t === 'tool')).toBe(false);
    }
  });
});
