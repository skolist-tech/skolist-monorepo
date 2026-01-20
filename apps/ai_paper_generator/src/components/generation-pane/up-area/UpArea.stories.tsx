import type { Meta, StoryObj } from "@storybook/react";
import { UpArea } from "./UpArea";
import { ActivityContext } from "../../../context/ActivityContext";
import {
  ConceptContext,
  type ConceptSelection,
} from "../../../context/ConceptContext";
import { QuestionsContext } from "../../../context/QuestionsContext";
import { fn } from "@storybook/test";
import type { Activity, SchoolClass, Subject } from "@skolist/db";

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
// Mock Data matches SchoolClass
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

const mockConceptsDefault: ConceptSelection = {
  boardId: "b1",
  classId: "c1",
  subjectId: "s1",
  checked: [],
  expanded: [],
};

// Generic Context Mocks
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
  selection: mockConceptsDefault,
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
  getSelectedLeafConceptIds: () => ["con1"], // Mock having some concepts selected
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
  deleteQuestion: async () => {},
  addCustomQuestion: async () => {},
  refetchQuestions: async () => {},
  markAllQuestionsOld: fn(),
};

const defaultProps = {
  hardnessLevels: { easy: 30, medium: 40, hard: 30 },
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
