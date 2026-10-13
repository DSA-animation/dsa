import { TreeNode } from './tree-node.model';

/** A node positioned for rendering. Coordinates are SVG user units (center of the node). */
export interface LayoutNode {
  readonly id: number;
  readonly val: number;
  x: number;
  y: number;
  readonly depth: number;
}

/** A parent→child connector, pre-resolved to endpoint coordinates. */
export interface LayoutEdge {
  readonly parentId: number;
  readonly childId: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** The full result of laying out a tree: positioned nodes, edges, and the viewBox size. */
export interface TreeLayout {
  readonly nodes: LayoutNode[];
  readonly edges: LayoutEdge[];
  readonly width: number;
  readonly height: number;
}

/** Visual constants. The node radius is shared with the canvas component. */
export const NODE_RADIUS = 22;
const H_GAP = 64; // horizontal distance between adjacent in-order slots
const V_GAP = 92; // vertical distance between depth levels
const MARGIN = NODE_RADIUS + 20; // padding around the tree inside the viewBox

/**
 * Lays out a binary tree.
 *
 * Phase-1 strategy: **in-order x, depth y**. An in-order traversal assigns each
 * node the next horizontal slot, which guarantees no two nodes overlap and that
 * left subtrees sit left of right subtrees. `y` is the node's depth. The result
 * is normalized so the tight bounding box starts at (0,0).
 *
 * This is deliberately a pure function returning plain data, so it can be
 * swapped for a prettier algorithm (Reingold–Tilford) later without touching
 * the renderer.
 */
export function layoutTree(root: TreeNode | null): TreeLayout {
  const empty: TreeLayout = { nodes: [], edges: [], width: 2 * MARGIN, height: 2 * MARGIN };
  if (!root) return empty;

  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  const byId = new Map<number, LayoutNode>();
  let slot = 0;

  // In-order walk assigns x (slot) and y (depth), and records each node.
  const place = (node: TreeNode, depth: number): void => {
    if (node.left) place(node.left, depth + 1);
    const ln: LayoutNode = {
      id: node.id,
      val: node.val,
      x: slot * H_GAP,
      y: depth * V_GAP,
      depth,
    };
    slot++;
    nodes.push(ln);
    byId.set(node.id, ln);
    if (node.right) place(node.right, depth + 1);
  };
  place(root, 0);

  // Second walk connects parents to children using the placed coordinates.
  const connect = (node: TreeNode): void => {
    const parent = byId.get(node.id)!;
    for (const child of [node.left, node.right]) {
      if (!child) continue;
      const c = byId.get(child.id)!;
      edges.push({ parentId: node.id, childId: child.id, x1: parent.x, y1: parent.y, x2: c.x, y2: c.y });
      connect(child);
    }
  };
  connect(root);

  // Normalize to a tight (0,0)-anchored box with a uniform margin.
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const dx = MARGIN - minX;
  const dy = MARGIN - minY;

  for (const n of nodes) {
    n.x += dx;
    n.y += dy;
  }
  for (const e of edges) {
    e.x1 += dx;
    e.y1 += dy;
    e.x2 += dx;
    e.y2 += dy;
  }

  return {
    nodes,
    edges,
    width: maxX - minX + 2 * MARGIN,
    height: maxY - minY + 2 * MARGIN,
  };
}
