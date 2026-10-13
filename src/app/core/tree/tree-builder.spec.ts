import { countNodes, fromLevelOrder } from './tree-builder';

describe('fromLevelOrder', () => {
  it('returns null for empty or null-root arrays', () => {
    expect(fromLevelOrder([])).toBeNull();
    expect(fromLevelOrder([null])).toBeNull();
  });

  it('builds a single-node tree', () => {
    const t = fromLevelOrder([1]);
    expect(t?.val).toBe(1);
    expect(t?.left).toBeNull();
    expect(t?.right).toBeNull();
  });

  it('builds the max-depth example [3,9,20,null,null,15,7]', () => {
    const t = fromLevelOrder([3, 9, 20, null, null, 15, 7]);
    expect(t?.val).toBe(3);
    expect(t?.left?.val).toBe(9);
    expect(t?.right?.val).toBe(20);
    expect(t?.left?.left).toBeNull();
    expect(t?.right?.left?.val).toBe(15);
    expect(t?.right?.right?.val).toBe(7);
    expect(countNodes(t)).toBe(5);
  });

  it('assigns unique ids in BFS order (root = 0)', () => {
    const t = fromLevelOrder([3, 9, 20])!;
    expect(t.id).toBe(0);
    expect(t.left?.id).toBe(1);
    expect(t.right?.id).toBe(2);
  });

  it('does not reserve child slots under a null', () => {
    // [1, null, 2, 3] => root 1 has only a right child 2, whose left child is 3.
    const t = fromLevelOrder([1, null, 2, 3]);
    expect(t?.left).toBeNull();
    expect(t?.right?.val).toBe(2);
    expect(t?.right?.left?.val).toBe(3);
  });
});
