export const formatQuestionType = (type: string): string => {
  switch (type) {
    case "mcq4":
      return "MCQ";
    case "msq4":
      return "MSQ";
    case "short_answer":
      return "Short Answer";
    case "long_answer":
      return "Long Answer";
    case "true_or_false":
      return "True/False";
    case "fill_in_the_blanks":
      return "Fill in the Blanks";
    case "match_the_following":
      return "Match the Following";
    case "numerical_answer":
      return "Numerical Answer";
    case "integer_answer":
      return "Integer Answer";
    default:
      return type.replace(/_/g, " ");
  }
};
