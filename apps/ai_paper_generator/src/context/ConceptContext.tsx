/**
 * Concept Context
 * Manages concept selection state with board detection and hierarchical tree data
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type { Node } from "react-checkbox-tree";
import {
  getSupabaseClient,
  type SchoolClass,
  type Subject,
  type Chapter,
  type Topic,
  type Concept,
} from "@skolist/db";
import { useAuth } from "@skolist/auth";

// =========================================================
// Types
// =========================================================

export interface ConceptSelection {
  boardId: string | null;
  classId: string | null;
  subjectId: string | null;
  checked: string[]; // IDs of checked nodes (for react-checkbox-tree)
  expanded: string[]; // IDs of expanded nodes (for react-checkbox-tree)
}

interface ConceptContextValue {
  // Selection state
  selection: ConceptSelection;

  // Data
  schoolClasses: SchoolClass[];
  subjects: Subject[];
  treeNodes: Node[];

  // Loading states
  isLoadingBoard: boolean;
  isLoadingSchoolClasses: boolean;
  isLoadingSubjects: boolean;
  isLoadingTree: boolean;

  // Error state
  error: string | null;

  // Actions
  selectSchoolClass: (classId: string) => void;
  selectSubject: (subjectId: string) => void;
  setChecked: (checked: string[]) => void;
  setExpanded: (expanded: string[]) => void;
  setSelectedConcepts: (conceptIds: string[]) => void;

  // Helpers
  getSelectedConceptIds: () => string[];
  getSelectedLeafConceptIds: () => string[];
}

const ConceptContext = createContext<ConceptContextValue | undefined>(
  undefined
);

// =========================================================
// Helper Functions
// =========================================================

/**
 * Build tree nodes for react-checkbox-tree from flat data
 */
function buildTreeNodes(
  chapters: Chapter[],
  topics: Topic[],
  concepts: Concept[]
): Node[] {
  // Group topics by chapter
  const topicsByChapter = new Map<string, Topic[]>();
  topics.forEach((topic) => {
    const existing = topicsByChapter.get(topic.chapter_id) || [];
    existing.push(topic);
    topicsByChapter.set(topic.chapter_id, existing);
  });

  // Group concepts by topic
  const conceptsByTopic = new Map<string, Concept[]>();
  concepts.forEach((concept) => {
    const existing = conceptsByTopic.get(concept.topic_id) || [];
    existing.push(concept);
    conceptsByTopic.set(concept.topic_id, existing);
  });

  // Build tree
  return chapters
    .sort(
      (a, b) =>
        ((a.position as unknown as number) ?? 0) -
        ((b.position as unknown as number) ?? 0)
    )
    .map((chapter) => {
      const chapterTopics = topicsByChapter.get(chapter.id) || [];

      return {
        value: `chapter:${chapter.id}`,
        label: chapter.name,
        icon: (
          <span className="font-semibold pr-6 text-green-600">
            {chapter.position}.
          </span>
        ),
        children: chapterTopics
          .sort(
            (a, b) =>
              (a.position as unknown as number) -
              (b.position as unknown as number)
          )
          .map((topic) => {
            const topicConcepts = conceptsByTopic.get(topic.id) || [];

            return {
              value: `topic:${topic.id}`,
              label: topic.name,
              icon: (
                <span className="mr-6 font-semibold text-amber-700">
                  {chapter.position}.{topic.position}
                </span>
              ),
              children: topicConcepts
                .sort((a, b) => a.page_number - b.page_number)
                .map((concept) => ({
                  value: `concept:${concept.id}`,
                  label: concept.name,
                })),
            };
          }),
      };
    });
}

/**
 * Extract actual concept IDs from checked values (removes chapter: and topic: prefixes)
 */
function extractConceptIds(checked: string[]): string[] {
  return checked
    .filter((id) => id.startsWith("concept:"))
    .map((id) => id.replace("concept:", ""));
}

// =========================================================
// Provider Component
// =========================================================

export function ConceptProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = getSupabaseClient();

  // Selection state
  const [selection, setSelection] = useState<ConceptSelection>({
    boardId: null,
    classId: null,
    subjectId: null,
    checked: [],
    expanded: [],
  });

  // Data state
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);

  // Loading states
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);
  const [isLoadingSchoolClasses, setIsLoadingSchoolClasses] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingTree, setIsLoadingTree] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Auto-selection state refs
  const hasAutoSelectedClass = useRef(false);
  const hasAutoSelectedSubject = useRef(false);

  // Build tree nodes from data
  const treeNodes = useMemo(
    () => buildTreeNodes(chapters, topics, concepts),
    [chapters, topics, concepts]
  );

  // =========================================================
  // Effect: Fetch user's board
  // =========================================================
  useEffect(() => {
    if (!user?.id) {
      setIsLoadingBoard(false);
      return;
    }

    const fetchBoard = async () => {
      setIsLoadingBoard(true);
      setError(null);

      try {
        // Fetch user profile from public.users
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("org_id, user_entered_school_board")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;

        let boardId: string | null = null;

        // If user has org, fetch org's board
        if (userData?.org_id) {
          const { data: orgData, error: orgError } = await supabase
            .from("orgs")
            .select("board_id")
            .eq("id", userData.org_id)
            .single();

          if (orgError) throw orgError;
          boardId = orgData?.board_id ?? null;
        } else {
          // Use user's manually entered board
          boardId = userData?.user_entered_school_board ?? null;
        }

        setSelection((prev) => ({ ...prev, boardId }));

        // Fetch classes for this board
        if (boardId) {
          setIsLoadingSchoolClasses(true);
          const { data: classData, error: classError } = await supabase
            .from("school_classes")
            .select("*")
            .eq("board_id", boardId)
            .order("position");

          if (classError) throw classError;
          setSchoolClasses(classData || []);
          setIsLoadingSchoolClasses(false);
        }
      } catch (err) {
        console.error("Error fetching board:", err);
        setError("Failed to load board information");
      } finally {
        setIsLoadingBoard(false);
      }
    };

    fetchBoard();
  }, [user?.id, supabase]);

  // =========================================================
  // Effect: Fetch subjects when class changes
  // =========================================================
  useEffect(() => {
    if (!selection.classId) {
      setSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      setIsLoadingSubjects(true);
      setError(null);

      try {
        const { data, error: subjectError } = await supabase
          .from("subjects")
          .select("*")
          .eq("school_class_id", selection.classId)
          .order("name");

        if (subjectError) throw subjectError;
        setSubjects(data || []);
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setError("Failed to load subjects");
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [selection.classId, supabase]);

  // =========================================================
  // Effect: Fetch tree data when subject changes
  // =========================================================
  useEffect(() => {
    if (!selection.subjectId) {
      setChapters([]);
      setTopics([]);
      setConcepts([]);
      return;
    }

    const fetchTreeData = async () => {
      setIsLoadingTree(true);
      setError(null);

      try {
        // Fetch chapters for subject
        const { data: chapterData, error: chapterError } = await supabase
          .from("chapters")
          .select("*")
          .eq("subject_id", selection.subjectId)
          .order("position");

        if (chapterError) throw chapterError;
        setChapters(chapterData || []);

        if (!chapterData?.length) {
          setTopics([]);
          setConcepts([]);
          setIsLoadingTree(false);
          return;
        }

        const chapterIds = chapterData.map((c: Chapter) => c.id);

        // Fetch topics for all chapters
        const { data: topicData, error: topicError } = await supabase
          .from("topics")
          .select("*")
          .in("chapter_id", chapterIds)
          .order("position");

        if (topicError) throw topicError;
        setTopics(topicData || []);

        if (!topicData?.length) {
          setConcepts([]);
          setIsLoadingTree(false);
          return;
        }

        const topicIds = topicData.map((t: Topic) => t.id);

        // Fetch concepts for all topics
        const { data: conceptData, error: conceptError } = await supabase
          .from("concepts")
          .select("*")
          .in("topic_id", topicIds)
          .order("page_number");

        if (conceptError) throw conceptError;
        setConcepts(conceptData || []);
      } catch (err) {
        console.error("Error fetching tree data:", err);
        setError("Failed to load concept tree");
      } finally {
        setIsLoadingTree(false);
      }
    };

    fetchTreeData();
  }, [selection.subjectId, supabase]);

  // =========================================================
  // Actions
  // =========================================================

  const selectSchoolClass = useCallback((classId: string) => {
    setSelection((prev) => ({
      ...prev,
      classId: classId || null,
      subjectId: null,
      checked: [],
      expanded: [],
    }));
  }, []);

  const selectSubject = useCallback((subjectId: string) => {
    setSelection((prev) => ({
      ...prev,
      subjectId: subjectId || null,
      checked: [],
      expanded: [],
    }));
  }, []);

  const setChecked = useCallback((checked: string[]) => {
    setSelection((prev) => ({ ...prev, checked }));
  }, []);

  const setExpanded = useCallback((expanded: string[]) => {
    setSelection((prev) => ({ ...prev, expanded }));
  }, []);

  const setSelectedConcepts = useCallback((conceptIds: string[]) => {
    // Convert concept IDs to tree format
    const checked = conceptIds.map((id) => `concept:${id}`);
    setSelection((prev) => ({ ...prev, checked }));
  }, []);

  // =========================================================
  // Effect: Auto-select first class and subject on load
  // =========================================================

  useEffect(() => {
    if (
      !isLoadingSchoolClasses &&
      schoolClasses.length > 0 &&
      !hasAutoSelectedClass.current
    ) {
      // Use function reference directly or ensure it's defined
      const firstClassId = schoolClasses[0]?.id;
      if (firstClassId) {
        selectSchoolClass(firstClassId);
        hasAutoSelectedClass.current = true;
      }
    }
  }, [isLoadingSchoolClasses, schoolClasses, selectSchoolClass]);

  useEffect(() => {
    if (
      !isLoadingSubjects &&
      subjects.length > 0 &&
      selection.classId &&
      !hasAutoSelectedSubject.current
    ) {
      const firstSubjectId = subjects[0]?.id;
      if (firstSubjectId) {
        selectSubject(firstSubjectId);
        hasAutoSelectedSubject.current = true;
      }
    }
  }, [isLoadingSubjects, subjects, selection.classId, selectSubject]);

  // =========================================================
  // Helpers
  // =========================================================

  const getSelectedConceptIds = useCallback(() => {
    // Return all checked IDs (includes chapters, topics, concepts)
    return selection.checked;
  }, [selection.checked]);

  const getSelectedLeafConceptIds = useCallback(() => {
    // Return only actual concept IDs (for API calls)
    return extractConceptIds(selection.checked);
  }, [selection.checked]);

  // =========================================================
  // Context Value
  // =========================================================

  const value: ConceptContextValue = {
    selection,
    schoolClasses,
    subjects,
    treeNodes,
    isLoadingBoard,
    isLoadingSchoolClasses,
    isLoadingSubjects,
    isLoadingTree,
    error,
    selectSchoolClass,
    selectSubject,
    setChecked,
    setExpanded,
    setSelectedConcepts,
    getSelectedConceptIds,
    getSelectedLeafConceptIds,
  };

  return (
    <ConceptContext.Provider value={value}>{children}</ConceptContext.Provider>
  );
}

// =========================================================
// Hook
// =========================================================

export function useConceptContext(): ConceptContextValue {
  const context = useContext(ConceptContext);
  if (context === undefined) {
    throw new Error("useConceptContext must be used within a ConceptProvider");
  }
  return context;
}
