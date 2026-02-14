import type { Meta, StoryObj } from "@storybook/react";
import { UpLeftArea } from "./UpLeftArea";
import {
  ConceptContext,
  type ConceptSelection,
} from "../../../../context/ConceptContext";
import type { SchoolClass, Subject } from "@skolist/db";
import { fn } from "@storybook/test";

const meta: Meta<typeof UpLeftArea> = {
  title: "Generation Pane/Up Area/UpLeftArea",
  component: UpLeftArea,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof UpLeftArea>;

// Mock Data matches SchoolClass
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
  {
    id: "c3",
    name: "Class 12",
    board_id: "b1",
    position: 3,
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
    name: "Physics",
    school_class_id: "c1",
    icon_url: null,
    created_at: "",
    updated_at: "",
  } as unknown as Subject,
  {
    id: "s3",
    name: "Chemistry",
    school_class_id: "c1",
    icon_url: null,
    created_at: "",
    updated_at: "",
  } as unknown as Subject,
];

const defaultSelection: ConceptSelection = {
  boardId: "b1",
  classId: null,
  subjectId: null,
  checked: [],
  expanded: [],
};

const contextValueDefaults = {
  selection: defaultSelection,
  schoolClasses: [],
  subjects: [],
  treeNodes: [],
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
  getSelectedLeafConceptIds: () => [],
};

export const Default: Story = {
  render: () => (
    <div style={{ width: "400px", height: "500px", border: "1px solid #ccc" }}>
      <ConceptContext.Provider
        value={{
          ...contextValueDefaults,
          schoolClasses: mockClasses,
          subjects: [],
        }}
      >
        <UpLeftArea />
      </ConceptContext.Provider>
    </div>
  ),
};

export const WithClassSelected: Story = {
  render: () => (
    <div style={{ width: "400px", height: "500px", border: "1px solid #ccc" }}>
      <ConceptContext.Provider
        value={{
          ...contextValueDefaults,
          schoolClasses: mockClasses,
          subjects: mockSubjects,
          selection: { ...defaultSelection, classId: "c1" },
        }}
      >
        <UpLeftArea />
      </ConceptContext.Provider>
    </div>
  ),
};

export const WithSubjectSelected: Story = {
  render: () => (
    <div style={{ width: "400px", height: "500px", border: "1px solid #ccc" }}>
      <ConceptContext.Provider
        value={{
          ...contextValueDefaults,
          schoolClasses: mockClasses,
          subjects: mockSubjects,
          selection: { ...defaultSelection, classId: "c1", subjectId: "s1" },
          treeNodes: [
            {
              value: "chapter:ch1",
              label: "Algebra",
              children: [
                {
                  value: "topic:t1",
                  label: "Linear Equations",
                  children: [
                    { value: "concept:con1", label: "Solving for x" },
                    { value: "concept:con2", label: "Graphing lines" },
                  ],
                },
              ],
            },
            {
              value: "chapter:ch2",
              label: "Geometry",
              children: [
                { value: "topic:t2", label: "Triangles", children: [] },
              ],
            },
          ],
        }}
      >
        <UpLeftArea />
      </ConceptContext.Provider>
    </div>
  ),
};

export const LoadingStates: Story = {
  render: () => (
    <div className="flex gap-4">
      <div
        style={{ width: "300px", height: "400px", border: "1px solid #ccc" }}
      >
        <h3>Loading Classes</h3>
        <ConceptContext.Provider
          value={{
            ...contextValueDefaults,
            isLoadingSchoolClasses: true,
          }}
        >
          <UpLeftArea />
        </ConceptContext.Provider>
      </div>
      <div
        style={{ width: "300px", height: "400px", border: "1px solid #ccc" }}
      >
        <h3>Loading Subjects</h3>
        <ConceptContext.Provider
          value={{
            ...contextValueDefaults,
            schoolClasses: mockClasses,
            selection: { ...defaultSelection, classId: "c1" },
            isLoadingSubjects: true,
          }}
        >
          <UpLeftArea />
        </ConceptContext.Provider>
      </div>
      <div
        style={{ width: "300px", height: "400px", border: "1px solid #ccc" }}
      >
        <h3>Loading Tree</h3>
        <ConceptContext.Provider
          value={{
            ...contextValueDefaults,
            schoolClasses: mockClasses,
            subjects: mockSubjects,
            selection: { ...defaultSelection, classId: "c1", subjectId: "s1" },
            isLoadingTree: true,
          }}
        >
          <UpLeftArea />
        </ConceptContext.Provider>
      </div>
    </div>
  ),
};
