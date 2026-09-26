import { Commit } from '@/types/git';

export interface GraphNode {
  commit: Commit;
  x: number;
  y: number;
  lane: number;
  color: string;
  isHead: boolean;
  refs: string[];
}

export interface GraphLink {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  color: string;
}

export interface GraphLayoutResult {
  nodes: GraphNode[];
  links: GraphLink[];
  width: number;
  height: number;
}

const LANE_COLORS = [
  '#58a6ff', // blue
  '#3fb950', // green
  '#bc8cff', // purple
  '#f0883e', // orange
  '#79c0ff', // light blue
  '#d29922', // yellow
  '#f778ba', // pink
  '#56d364', // bright green
];

export function computeCommitGraph(
  commits: Commit[],
  headOid?: string,
  branches: { name: string; commitOid?: string }[] = [],
  tags: { name: string; oid: string }[] = [],
  rowHeight: number = 44,
  laneWidth: number = 24
): GraphLayoutResult {
  if (!commits || commits.length === 0) {
    return { nodes: [], links: [], width: 100, height: 100 };
  }

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Map commit OID to branches and tags pointing to it
  const refMap = new Map<string, string[]>();
  for (const b of branches) {
    if (b.commitOid) {
      const list = refMap.get(b.commitOid) || [];
      list.push(b.name);
      refMap.set(b.commitOid, list);
    }
  }
  for (const t of tags) {
    if (t.oid) {
      const list = refMap.get(t.oid) || [];
      list.push(`tag: ${t.name}`);
      refMap.set(t.oid, list);
    }
  }

  // Active lanes tracking commit OIDs expecting to connect to their parents
  const activeLanes: (string | null)[] = [];
  const commitIndices = new Map<string, number>();

  commits.forEach((c, idx) => {
    commitIndices.set(c.oid, idx);
  });

  commits.forEach((commit, rowIndex) => {
    // Check if this commit was already assigned a lane by a child
    let lane = activeLanes.indexOf(commit.oid);

    if (lane === -1) {
      // Find first empty lane or add new lane
      lane = activeLanes.indexOf(null);
      if (lane === -1) {
        lane = activeLanes.length;
        activeLanes.push(commit.oid);
      } else {
        activeLanes[lane] = commit.oid;
      }
    }

    const color = LANE_COLORS[lane % LANE_COLORS.length];
    const x = lane * laneWidth + 18;
    const y = rowIndex * rowHeight + 22;

    const commitRefs = refMap.get(commit.oid) || [];
    const isHead = commit.oid === headOid;

    nodes.push({
      commit,
      x,
      y,
      lane,
      color,
      isHead,
      refs: commitRefs,
    });

    // Determine parents and route links
    const parents = commit.parent || [];

    if (parents.length === 0) {
      // Root commit ends this lane
      activeLanes[lane] = null;
    } else {
      // First parent continues in this lane
      activeLanes[lane] = parents[0];

      // Additional parents (merges) get other lanes
      for (let pIdx = 1; pIdx < parents.length; pIdx++) {
        const parentOid = parents[pIdx];
        let pLane = activeLanes.indexOf(parentOid);
        if (pLane === -1) {
          pLane = activeLanes.indexOf(null);
          if (pLane === -1) {
            pLane = activeLanes.length;
            activeLanes.push(parentOid);
          } else {
            activeLanes[pLane] = parentOid;
          }
        }
      }
    }
  });

  // Now create links connecting each commit node to its parent nodes
  for (const node of nodes) {
    const parents = node.commit.parent || [];
    for (const parentOid of parents) {
      const parentNode = nodes.find((n) => n.commit.oid === parentOid);
      if (parentNode) {
        links.push({
          id: `${node.commit.oid}->${parentNode.commit.oid}`,
          sourceX: node.x,
          sourceY: node.y,
          targetX: parentNode.x,
          targetY: parentNode.y,
          color: node.color,
        });
      }
    }
  }

  const maxLane = Math.max(...nodes.map((n) => n.lane), 1);
  const width = (maxLane + 1) * laneWidth + 40;
  const height = commits.length * rowHeight + 40;

  return { nodes, links, width, height };
}
