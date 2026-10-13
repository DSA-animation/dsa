import { fromLevelOrder } from './tree-builder';
import { layoutTree } from './tree-layout';

describe('layoutTree', () => {
  const byVal = (nodes: { val: number; x: number; y: number }[], v: number) =>
    nodes.find((n) => n.val === v)!;

  it('returns an empty layout for a null tree', () => {
    const l = layoutTree(null);
    expect(l.nodes).toHaveLength(0);
    expect(l.edges).toHaveLength(0);
  });

  it('positions every node and connects n-1 edges', () => {
    const t = fromLevelOrder([3, 9, 20, null, null, 15, 7]);
    const l = layoutTree(t);
    expect(l.nodes).toHaveLength(5);
    expect(l.edges).toHaveLength(4);
  });

  it('orders nodes left-to-right by in-order position', () => {
    const l = layoutTree(fromLevelOrder([2, 1, 3]));
    expect(byVal(l.nodes, 1).x).toBeLessThan(byVal(l.nodes, 2).x);
    expect(byVal(l.nodes, 2).x).toBeLessThan(byVal(l.nodes, 3).x);
  });

  it('places children below their parent', () => {
    const l = layoutTree(fromLevelOrder([2, 1, 3]));
    expect(byVal(l.nodes, 1).y).toBeGreaterThan(byVal(l.nodes, 2).y);
    expect(byVal(l.nodes, 3).y).toBeGreaterThan(byVal(l.nodes, 2).y);
  });

  it('normalizes the layout into a (0,0)-anchored box', () => {
    const l = layoutTree(fromLevelOrder([1, 2, 3]));
    expect(Math.min(...l.nodes.map((n) => n.x))).toBeGreaterThanOrEqual(0);
    expect(Math.min(...l.nodes.map((n) => n.y))).toBeGreaterThanOrEqual(0);
    expect(l.width).toBeGreaterThan(0);
    expect(l.height).toBeGreaterThan(0);
  });
});
