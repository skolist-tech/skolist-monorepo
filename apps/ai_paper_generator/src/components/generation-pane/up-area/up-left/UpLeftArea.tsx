/**
 * Up Left Area
 * Contains Class/Subject selectors and Concept Tree
 * Uses ConceptContext for state management
 */

import { useConceptContext } from "../../../../context/ConceptContext";
import { ClassSelector } from "./ClassSelector";
import { SubjectSelector } from "./SubjectSelector";
import { ConceptSelectorTree } from "./ConceptSelector/ConceptSelectorTree";

export function UpLeftArea() {
  const {
    selection,
    selectSchoolClass,
    selectSubject,
    isLoadingSchoolClasses,
    isLoadingSubjects,
    isLoadingTree,
  } = useConceptContext();

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Class and Subject selectors side by side */}
      <div className="grid flex-none grid-cols-2 gap-4">
        <ClassSelector
          value={selection.classId ?? ""}
          onChange={selectSchoolClass}
        />
        <SubjectSelector
          value={selection.subjectId ?? ""}
          onChange={selectSubject}
          classId={selection.classId ?? ""}
        />
      </div>

      {/* Instructional label */}
      <p className="flex-none text-sm font-medium text-muted-foreground">
        <span style={{ color: "#000000" }}>Select</span>{" "}
        <span style={{ color: "#16a34a" }}>Chapters</span>
        {" / "}
        <span style={{ color: "#b45309" }}>Topics</span>
        {" / "}
        <span style={{ color: "#2E0057" }}>Concepts</span>:
      </p>

      {/* Show loading state */}
      {(isLoadingSchoolClasses || isLoadingSubjects || isLoadingTree) && (
        <div className="flex-none text-sm text-muted-foreground">
          Loading...
        </div>
      )}

      {/* Concept Tree */}
      {selection.subjectId && (
        <div className="max-h-[600px] flex-1 overflow-y-auto rounded-md p-2">
          <ConceptSelectorTree />
        </div>
      )}
    </div>
  );
}
