/**
 * Concept Selector Tree
 * Three-level tree (Chapter → Topic → Concept) with cascading checkbox selection
 */

import { useState, useMemo, useEffect, useRef } from "react";
import CheckboxTree, { type Node } from "react-checkbox-tree";
import "react-checkbox-tree/lib/react-checkbox-tree.css";
import {
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Loader2,
  Search,
  X,
} from "lucide-react";

import { Input, Checkbox } from "@skolist/ui";
import { useConceptContext } from "../../../../../context/ConceptContext";

/**
 * Recursively filters tree nodes based on search query.
 * Returns nodes where the label matches OR any descendant matches.
 * When a match is found, all ancestors are included.
 */
function filterTreeNodes(
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
function getAllNodeIds(nodes: Node[]): string[] {
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

export function ConceptSelectorTree() {
  const { selection, treeNodes, isLoadingTree, setChecked, setExpanded } =
    useConceptContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState<string[]>([]);
  const prevSearchQuery = useRef("");

  const displayNodes = useMemo(() => {
    if (!searchQuery.trim()) {
      return treeNodes;
    }
    const { filteredNodes } = filterTreeNodes(treeNodes, searchQuery);
    return filteredNodes;
  }, [treeNodes, searchQuery]);

  // Auto-expand all nodes when search query changes (but allow manual collapse after)
  useEffect(() => {
    if (searchQuery.trim() && searchQuery !== prevSearchQuery.current) {
      const allIds = getAllNodeIds(displayNodes);
      setSearchExpanded(allIds);
    }
    prevSearchQuery.current = searchQuery;
  }, [searchQuery, displayNodes]);

  // Reset search expanded state when search is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchExpanded([]);
    }
  }, [searchQuery]);

  if (!selection.subjectId) {
    return (
      <div className="rounded-md border border-dashed border-muted-foreground/25 p-6 text-center text-sm text-muted-foreground">
        Select a class and subject to view concepts
      </div>
    );
  }

  if (isLoadingTree) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading concepts...
        </span>
      </div>
    );
  }

  if (treeNodes.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-muted-foreground/25 p-6 text-center text-sm text-muted-foreground">
        No concepts found for this subject
      </div>
    );
  }

  return (
    <div className="concept-tree-container rounded-md border bg-background p-2">
      {/* Search bar */}
      <div className="mb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="mb-2 pl-6">
        <label className="flex cursor-pointer items-center space-x-2">
          <Checkbox
            checked={
              getAllNodeIds(displayNodes).length > 0 &&
              getAllNodeIds(displayNodes).every((id) =>
                selection.checked.includes(id)
              )
                ? true
                : getAllNodeIds(displayNodes).some((id) =>
                      selection.checked.includes(id)
                    )
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={() => {
              const allIds = getAllNodeIds(displayNodes);
              const isAllSelected = allIds.every((id) =>
                selection.checked.includes(id)
              );
              const newChecked = isAllSelected
                ? selection.checked.filter((id) => !allIds.includes(id))
                : Array.from(new Set([...selection.checked, ...allIds]));
              setChecked(newChecked);
            }}
          />
          <span className="text-sm font-semibold text-[#16a34a]">
            Select All Chapters
          </span>
        </label>
      </div>

      {displayNodes.length === 0 ? (
        <div className="py-4 text-center text-sm text-muted-foreground">
          No results found
        </div>
      ) : (
        <CheckboxTree
          nodes={displayNodes}
          checked={selection.checked}
          expanded={searchQuery ? searchExpanded : selection.expanded}
          onCheck={setChecked}
          onExpand={searchQuery ? setSearchExpanded : setExpanded}
          icons={{
            check: <Checkbox checked={true} className="pointer-events-none" />,
            uncheck: (
              <Checkbox checked={false} className="pointer-events-none" />
            ),
            halfCheck: (
              <Checkbox
                checked="indeterminate"
                className="pointer-events-none"
              />
            ),
            expandClose: <ChevronRight className="h-4 w-4" />,
            expandOpen: <ChevronDown className="h-4 w-4" />,
            expandAll: null,
            collapseAll: null,
            parentClose: null,
            parentOpen: null,
            leaf: <Lightbulb className="h-4 w-4 text-yellow-500" />,
          }}
          showNodeIcon={true}
          noCascade={false}
        />
      )}
      <style>{`
        .concept-tree-container {
          height: 500px; /* Adjust height as needed */
          overflow-y: auto; /* Enable vertical scrolling */
          overflow-x: hidden; /* Prevent horizontal scrolling */
        }
        .concept-tree-container .react-checkbox-tree {
          font-size: 0.875rem;
        }
        .concept-tree-container .rct-node {
          padding: 2px 0;
        }
        .concept-tree-container .rct-text {
          display: flex;
          align-items: center;
          gap: 4px;
          min-height: 24px; /* Fix height for consistent centering */
        }
        .concept-tree-container .rct-title {
          padding-left: 2px;
        }
        .concept-tree-container .rct-collapse,
        .concept-tree-container .rct-checkbox {
          padding: 0 4px;
          cursor: pointer;
        }
        .concept-tree-container .rct-node-icon {
          padding: 0 2px;
        }
        .concept-tree-container ol {
          padding-left: 20px;
          position: relative;
        }
        /* Vertical connector line from parent to children */
        .concept-tree-container ol ol {
          margin-left: 8px;
          border-left: 1px solid hsl(var(--border));
        }
        .concept-tree-container .rct-node-parent > .rct-text > .rct-node-icon svg {
          color: hsl(var(--primary));
        }
        /* Level 1 - Chapters: green */
        .concept-tree-container .react-checkbox-tree > ol > li > .rct-text .rct-title {
          color: #16a34a !important;
          font-weight: 600;
        }
        /* Level 2 - Topics: dark yellow/amber */
        .concept-tree-container .react-checkbox-tree > ol > li > ol > li > .rct-text .rct-title {
          color: #b45309 !important;
          font-weight: 500;
        }
        /* Level 3 - Concepts: orange */
        .concept-tree-container .react-checkbox-tree > ol > li > ol > li > ol > li > .rct-text .rct-title {
          color: #2E0057 !important;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
