/**
 * Concept Selector Tree
 * Three-level tree (Chapter → Topic → Concept) with cascading checkbox selection
 */

import { useState, useMemo, useEffect, useRef } from "react";
import CheckboxTree from "react-checkbox-tree";
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
import { filterTreeNodes, getAllNodeIds } from "./treeUtils";
import "./ConceptSelectorTree.css";

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

  // Get all node IDs currently visible in the filtered view
  const visibleNodeIds = useMemo(() => {
    return getAllNodeIds(displayNodes);
  }, [displayNodes]);

  // Custom check handler that preserves selections outside the current search view
  const handleCheck = (newChecked: string[]) => {
    if (!searchQuery.trim()) {
      // Not in search mode - use normal behavior
      setChecked(newChecked);
    } else {
      // In search mode - merge with existing selections outside the filtered view
      // Keep selections that are NOT in the visible nodes (preserve hidden selections)
      const hiddenSelections = selection.checked.filter(
        (id) => !visibleNodeIds.includes(id)
      );
      // Combine hidden selections with the new checked items from the filtered view
      const mergedChecked = Array.from(
        new Set([...hiddenSelections, ...newChecked])
      );
      setChecked(mergedChecked);
    }
  };

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
          onCheck={handleCheck}
          // The typings for React Checkbox Tree can sometimes be messy with generic Expand handlers
          // but we can trust the state setters here.

          onExpand={(expand) =>
            searchQuery ? setSearchExpanded(expand) : setExpanded(expand)
          }
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
    </div>
  );
}
