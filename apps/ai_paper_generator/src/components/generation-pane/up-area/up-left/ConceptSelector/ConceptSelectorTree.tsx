/**
 * Concept Selector Tree
 * Three-level tree (Chapter → Topic → Concept) with cascading checkbox selection
 */

import CheckboxTree from "react-checkbox-tree";
import "react-checkbox-tree/lib/react-checkbox-tree.css";
import {
  ChevronRight,
  ChevronDown,
  Square,
  CheckSquare,
  MinusSquare,
  BookOpen,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { useConceptContext } from "../../../../../context/ConceptContext";

export function ConceptSelectorTree() {
  const { selection, treeNodes, isLoadingTree, setChecked, setExpanded } =
    useConceptContext();

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
      <CheckboxTree
        nodes={treeNodes}
        checked={selection.checked}
        expanded={selection.expanded}
        onCheck={setChecked}
        onExpand={setExpanded}
        icons={{
          check: <CheckSquare className="h-4 w-4 text-primary" />,
          uncheck: <Square className="h-4 w-4 text-muted-foreground" />,
          halfCheck: <MinusSquare className="h-4 w-4 text-primary/70" />,
          expandClose: <ChevronRight className="h-4 w-4" />,
          expandOpen: <ChevronDown className="h-4 w-4" />,
          expandAll: null,
          collapseAll: null,
          parentClose: <BookOpen className="h-4 w-4 text-blue-500" />,
          parentOpen: <BookOpen className="h-4 w-4 text-blue-500" />,
          leaf: <Lightbulb className="h-4 w-4 text-yellow-500" />,
        }}
        showNodeIcon={true}
        noCascade={false}
      />
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
        }
        .concept-tree-container .rct-title {
          padding-left: 4px;
        }
        .concept-tree-container .rct-collapse,
        .concept-tree-container .rct-checkbox {
          padding: 0 4px;
          cursor: pointer;
        }
        .concept-tree-container .rct-node-icon {
          padding: 0 4px;
        }
        .concept-tree-container ol {
          padding-left: 20px;
        }
        .concept-tree-container .rct-node-parent > .rct-text > .rct-node-icon svg {
          color: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}
