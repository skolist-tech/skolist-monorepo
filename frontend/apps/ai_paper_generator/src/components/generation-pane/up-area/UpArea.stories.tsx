import type { Meta, StoryObj } from "@storybook/react";
import { UpArea } from "./UpArea";
import { ActivityContext } from "../../../context/ActivityContext";
import {
  ConceptContext,
  type ConceptSelection,
} from "../../../context/ConceptContext";
import { QuestionsContext } from "../../../context/QuestionsContext";
import { fn } from "@storybook/test";
import type {
  Activity,
  SchoolClass,
  Subject,
  HardnessLevel,
} from "@skolist/db";
import { useState } from "react";

const meta: Meta<typeof UpArea> = {
  title: "Generation Pane/Up Area/UpArea",
  component: UpArea,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof UpArea>;

// Mock Data
const mockActivity: Activity = {
  id: "act1",
  name: "New Activity 1",
  user_id: "u1",
  org_id: "o1",
  created_at: "",
  updated_at: "",
  is_archived: false,
} as unknown as Activity;

const mockClasses: SchoolClass[] = [
  {
    id: "c1",
    name: "Class 10",
    board_id: "b1",
    position: 1,
    created_at: "",
    updated_at: "",
  } as unknown as SchoolClass,
  {
    id: "c2",
    name: "Class 11",
    board_id: "b1",
    position: 2,
    created_at: "",
    updated_at: "",
  } as unknown as SchoolClass,
];

const mockSubjects: Subject[] = [
  {
    id: "s1",
    name: "Mathematics",
    school_class_id: "c1",
    icon_url: null,
    created_at: "",
    updated_at: "",
  } as unknown as Subject,
  {
    id: "s2",
    name: "Science",
    school_class_id: "c1",
    icon_url: null,
    created_at: "",
    updated_at: "",
  } as unknown as Subject,
];

// Interactive wrapper component with full state management
function InteractiveUpArea() {
  const [selection, setSelection] = useState<ConceptSelection>({
    boardId: "b1",
    classId: "c1",
    subjectId: "s1",
    checked: [],
    expanded: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const activityContextValue = {
    activities: [mockActivity],
    currentActivity: mockActivity,
    isLoading: false,
    error: null,
    createActivity: async () => mockActivity,
    selectActivity: fn(),
    deleteActivity: async () => {},
    renameActivity: async () => {},
    refreshActivities: async () => {},
  };

  const conceptContextValue = {
    selection,
    schoolClasses: mockClasses,
    subjects: mockSubjects,
    treeNodes: [
      {
        value: "chapter:ch1",
        label: "Algebra",
        icon: <span className="pr-6 font-semibold text-green-600">1.</span>,
        children: [
          {
            value: "topic:t1",
            label: "Linear Equations",
            icon: (
              <span className="mr-6 font-semibold text-amber-700">1.1</span>
            ),
            children: [
              { value: "concept:con1", label: "Solving for x" },
              { value: "concept:con2", label: "Graphing lines" },
            ],
          },
          {
            value: "topic:t2",
            label: "Quadratic Equations",
            icon: (
              <span className="mr-6 font-semibold text-amber-700">1.2</span>
            ),
            children: [
              { value: "concept:con3", label: "Factoring" },
              { value: "concept:con4", label: "Completing the square" },
            ],
          },
        ],
      },
      {
        value: "chapter:ch2",
        label: "Geometry",
        icon: <span className="pr-6 font-semibold text-green-600">2.</span>,
        children: [
          {
            value: "topic:t3",
            label: "Triangles",
            icon: (
              <span className="mr-6 font-semibold text-amber-700">2.1</span>
            ),
            children: [
              { value: "concept:con5", label: "Pythagorean theorem" },
              { value: "concept:con6", label: "Triangle congruence" },
            ],
          },
        ],
      },
    ],
    isLoadingBoard: false,
    isLoadingSchoolClasses: false,
    isLoadingSubjects: false,
    isLoadingTree: false,
    error: null,
    selectSchoolClass: (classId: string) => {
      setSelection((prev) => ({
        ...prev,
        classId: classId || null,
        subjectId: null,
        checked: [],
        expanded: [],
      }));
    },
    selectSubject: (subjectId: string) => {
      setSelection((prev) => ({
        ...prev,
        subjectId: subjectId || null,
        checked: [],
        expanded: [],
      }));
    },
    setChecked: (checked: string[]) => {
      setSelection((prev) => ({ ...prev, checked }));
    },
    setExpanded: (expanded: string[]) => {
      setSelection((prev) => ({ ...prev, expanded }));
    },
    setSelectedConcepts: (conceptIds: string[]) => {
      const checked = conceptIds.map((id) => `concept:${id}`);
      setSelection((prev) => ({ ...prev, checked }));
    },
    getSelectedConceptIds: () => selection.checked,
    getSelectedLeafConceptIds: () =>
      selection.checked
        .filter((id) => id.startsWith("concept:"))
        .map((id) => id.replace("concept:", "")),
  };

  const questionsContextValue = {
    questions: [],
    isLoading: false,
    error: null,
    moveQuestionToDraft: async () => {},
    moveQuestionsToDraft: async () => {},
    moveQuestionToGeneration: async () => {},
    updateQuestionLocal: () => {},
    saveQuestion: async () => {},
    saveQuestionWithVersion: async () => {},
    deleteQuestion: async () => {},
    deleteQuestions: async () => {},
    addCustomQuestion: async () => {},
    refetchQuestions: async () => {},
    markAllQuestionsOld: async () => {},
    undoQuestion: async () => {},
    redoQuestion: async () => {},
    getQuestionVersionState: async () => ({ canUndo: false, canRedo: false }),
  };

  const handleHardnessLevelChange = (level: HardnessLevel, value: number) => {
    // UpArea now manages difficulty levels internally
    // This callback is for syncing with parent if needed
    console.log(`Difficulty level changed: ${level} = ${value}`);
  };

  const handleGenerateStart = () => {
    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <ActivityContext.Provider value={activityContextValue}>
      <QuestionsContext.Provider value={questionsContextValue}>
        <ConceptContext.Provider value={conceptContextValue}>
          <div className="bg-background p-4">
            <UpArea
              onHardnessLevelChange={handleHardnessLevelChange}
              isGenerating={isGenerating}
              onGenerateStart={handleGenerateStart}
              onGenerateEnd={() => setIsGenerating(false)}
            />
          </div>
        </ConceptContext.Provider>
      </QuestionsContext.Provider>
    </ActivityContext.Provider>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveUpArea />,
};

// Keep the static stories for reference
const activityContextDefault = {
  activities: [mockActivity],
  currentActivity: mockActivity,
  isLoading: false,
  error: null,
  createActivity: async () => mockActivity,
  selectActivity: fn(),
  deleteActivity: async () => {},
  renameActivity: async () => {},
  refreshActivities: async () => {},
};

const conceptContextDefault = {
  selection: {
    boardId: "b1",
    classId: "c1",
    subjectId: "s1",
    checked: [],
    expanded: [],
  },
  schoolClasses: mockClasses,
  subjects: mockSubjects,
  treeNodes: [
    {
      value: "chapter:ch1",
      label: "Chapter 1",
      children: [
        {
          value: "topic:t1",
          label: "Topic 1",
          children: [
            { value: "concept:con1", label: "Concept 1" },
            { value: "concept:con2", label: "Concept 2" },
          ],
        },
      ],
    },
  ],
  isLoadingBoard: false,
  isLoadingSchoolClasses: false,
  isLoadingSubjects: false,
  isLoadingTree: false,
  error: null,
  selectSchoolClass: fn(),
  selectSubject: fn(),
  setChecked: fn(),
  setExpanded: fn(),
  setSelectedConcepts: fn(),
  getSelectedConceptIds: () => [],
  getSelectedLeafConceptIds: () => ["con1"],
};

const questionsContextDefault = {
  questions: [],
  isLoading: false,
  error: null,
  moveQuestionToDraft: async () => {},
  moveQuestionsToDraft: async () => {},
  moveQuestionToGeneration: async () => {},
  updateQuestionLocal: () => {},
  saveQuestion: async () => {},
  saveQuestionWithVersion: async () => {},
  deleteQuestion: async () => {},
  deleteQuestions: async () => {},
  addCustomQuestion: async () => {},
  refetchQuestions: async () => {},
  markAllQuestionsOld: fn(),
  undoQuestion: async () => {},
  redoQuestion: async () => {},
  getQuestionVersionState: async () => ({ canUndo: false, canRedo: false }),
};

const defaultProps = {
  onHardnessLevelChange: fn(),
  isGenerating: false,
  onGenerateStart: fn(),
  onGenerateEnd: fn(),
};

export const Default: Story = {
  render: (args) => (
    <ActivityContext.Provider value={activityContextDefault}>
      <QuestionsContext.Provider value={questionsContextDefault}>
        <ConceptContext.Provider value={conceptContextDefault}>
          <div className="bg-background p-4">
            <UpArea {...args} />
          </div>
        </ConceptContext.Provider>
      </QuestionsContext.Provider>
    </ActivityContext.Provider>
  ),
  args: defaultProps,
};

export const Generating: Story = {
  render: (args) => (
    <ActivityContext.Provider value={activityContextDefault}>
      <QuestionsContext.Provider value={questionsContextDefault}>
        <ConceptContext.Provider value={conceptContextDefault}>
          <div className="bg-background p-4">
            <UpArea {...args} />
          </div>
        </ConceptContext.Provider>
      </QuestionsContext.Provider>
    </ActivityContext.Provider>
  ),
  args: {
    ...defaultProps,
    isGenerating: true,
  },
};

export const NoActivitySelected: Story = {
  render: (args) => (
    <ActivityContext.Provider
      value={{ ...activityContextDefault, currentActivity: null }}
    >
      <QuestionsContext.Provider value={questionsContextDefault}>
        <ConceptContext.Provider value={conceptContextDefault}>
          <div className="bg-background p-4">
            <UpArea {...args} />
          </div>
        </ConceptContext.Provider>
      </QuestionsContext.Provider>
    </ActivityContext.Provider>
  ),
  args: defaultProps,
};

export const WithNoConceptsSelected: Story = {
  render: (args) => (
    <ActivityContext.Provider value={activityContextDefault}>
      <QuestionsContext.Provider value={questionsContextDefault}>
        <ConceptContext.Provider
          value={{
            ...conceptContextDefault,
            getSelectedLeafConceptIds: () => [],
          }}
        >
          <div className="bg-background p-4">
            <UpArea {...args} />
          </div>
        </ConceptContext.Provider>
      </QuestionsContext.Provider>
    </ActivityContext.Provider>
  ),
  args: defaultProps,
};
