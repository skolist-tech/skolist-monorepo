import type {
  PaletteStatus,
  StudentQuestion,
  StudentResponse,
} from "@/types/assessment";

export function isPassageStem(question: StudentQuestion): boolean {
  return Number(question.marks) === 0 && !question.parent_question_id;
}

export function isAnswerable(question: StudentQuestion): boolean {
  return !isPassageStem(question);
}

export function hasSavedAnswer(
  question: StudentQuestion,
  response?: StudentResponse
): boolean {
  if (!response) return false;
  const qtype = question.question_type;
  if (qtype === "mcq") return response.selected_mcq_option != null;
  if (qtype === "msq")
    return Boolean(response.selected_msq_options?.some(Boolean));
  if (qtype === "numerical") return response.numerical_answer != null;
  if (qtype === "integer") return response.integer_answer != null;
  return false;
}

export function paletteStatus(
  question: StudentQuestion,
  response?: StudentResponse
): PaletteStatus {
  const answered = hasSavedAnswer(question, response);
  const marked = Boolean(response?.is_marked_for_review);
  const visited = Boolean(response?.is_visited) || answered || marked;

  if (answered && marked) return "answered_marked";
  if (marked) return "marked";
  if (answered) return "answered";
  if (visited) return "not_answered";
  return "not_visited";
}

export function optionEntries(question: StudentQuestion, includeEmpty = false) {
  const entries = [
    {
      index: 1,
      text: question.option1,
      imageUrl: question.option1_image_url,
      svgCode: question.option1_svg_image_code,
    },
    {
      index: 2,
      text: question.option2,
      imageUrl: question.option2_image_url,
      svgCode: question.option2_svg_image_code,
    },
    {
      index: 3,
      text: question.option3,
      imageUrl: question.option3_image_url,
      svgCode: question.option3_svg_image_code,
    },
    {
      index: 4,
      text: question.option4,
      imageUrl: question.option4_image_url,
      svgCode: question.option4_svg_image_code,
    },
  ];
  if (includeEmpty) return entries;
  return entries.filter((item) => item.text || item.imageUrl || item.svgCode);
}

export function emptyAnswerPayload(
  question: StudentQuestion
): Partial<StudentResponse> {
  if (question.question_type === "mcq") {
    return { selected_mcq_option: null };
  }
  if (question.question_type === "msq") {
    return { selected_msq_options: [false, false, false, false] };
  }
  if (question.question_type === "numerical") {
    return { numerical_answer: null };
  }
  if (question.question_type === "integer") {
    return { integer_answer: null };
  }
  return {};
}

export function draftHasAnswer(
  question: StudentQuestion,
  draft: Partial<StudentResponse>
): boolean {
  if (question.question_type === "mcq")
    return draft.selected_mcq_option != null;
  if (question.question_type === "msq")
    return Boolean(draft.selected_msq_options?.some(Boolean));
  if (question.question_type === "numerical")
    return (
      draft.numerical_answer != null && draft.numerical_answer !== ("" as never)
    );
  if (question.question_type === "integer") return draft.integer_answer != null;
  return false;
}
