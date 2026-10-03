import { describe, expect, it } from 'vitest';
import { stadiumPoint, hitFlight } from './heroHit';

describe('the title ball lands on the stadium artwork', () => {
  it('locates a landmark in an uncropped, translated image', () => {
    expect(stadiumPoint({ x: .5, y: .5 }, { left: 30, top: 80, width: 1672, height: 941 }, { x: .62, y: .58 }))
      .toEqual({ x: 866, y: 550.5 });
  });
  it('accounts for horizontal cover cropping on a portrait phone', () => {
    // A 941px-high image remains 1672px wide; right-alignment hides 1272px.
    const point = stadiumPoint({ x: .8, y: .6 }, { left: 0, top: 100, width: 400, height: 941 }, { x: 1, y: .5 });
    expect(point.x).toBeCloseTo(65.6);
    expect(point.y).toBeCloseTo(664.6);
  });
  it('accounts for vertical cover cropping on a wide display', () => {
    const point = stadiumPoint({ x: .5, y: .5 }, { left: 0, top: 0, width: 1672, height: 600 }, { x: .62, y: 1 });
    expect(point).toEqual({ x: 836, y: 129.5 });
  });
  it('can launch left towards the field without first looping right', () => {
    const plan = hitFlight({ x: 300, y: 600 }, { x: 300, y: 600 }, { x: 120, y: 480 }, 400, 0, 0);
    const coordinates = plan.path.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    expect(coordinates[2]).toBeGreaterThan(120);
    expect(coordinates[2]).toBeLessThan(300);
    expect(plan.end).toEqual({ x: 120, y: 480 });
  });
});
