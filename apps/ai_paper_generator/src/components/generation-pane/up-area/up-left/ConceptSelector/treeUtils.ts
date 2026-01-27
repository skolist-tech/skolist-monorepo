import type { Node } from "react-checkbox-tree";

/**
 * Recursively filters tree nodes based on search query.
 * Returns nodes where the label matches OR any descendant matches.
 * When a match is found, all ancestors are included.
 */
export function filterTreeNodes(
  nodes: Node[],
  query: string
): { filteredNodes: Node[]; matchingNodeIds: string[] } {
  const lowerQuery = query.toLowerCase();
  const matchingNodeIds: string[] = [];

  function filterNode(node: Node): Node | null {
    const labelMatches = node.label
      ?.toString()
      .toLowerCase()
      .includes(lowerQuery);

    if (node.children && node.children.length > 0) {
      const filteredChildren = node.children
        .map(filterNode)
        .filter((child): child is Node => child !== null);

      if (labelMatches || filteredChildren.length > 0) {
        if (labelMatches || filteredChildren.length > 0) {
          matchingNodeIds.push(node.value);
        }
        return {
          ...node,
          children:
            filteredChildren.length > 0 ? filteredChildren : node.children,
        };
      }
      return null;
    }

    if (labelMatches) {
      matchingNodeIds.push(node.value);
      return node;
    }
    return null;
  }

  const filteredNodes = nodes
    .map(filterNode)
    .filter((node): node is Node => node !== null);

  return { filteredNodes, matchingNodeIds };
}

/**
 * Gets all node IDs from a tree (for expanding all when searching)
 */
export function getAllNodeIds(nodes: Node[]): string[] {
  const ids: string[] = [];
  function collect(nodeList: Node[]) {
    for (const node of nodeList) {
      ids.push(node.value);
      if (node.children) {
        collect(node.children);
      }
    }
  }
  collect(nodes);
  return ids;
}
