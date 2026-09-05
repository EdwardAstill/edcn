import { expect, test } from "bun:test";

import {
  type GradeResult,
  type QuizDefinition,
  type QuizQuestion,
} from "../../registry/quiz/lib/model";
import { gradeAnswer, scoreQuiz } from "../../registry/quiz/lib/grading";

function singleChoice(
  overrides: Partial<Extract<QuizQuestion, { type: "single" }>> = {},
): Extract<QuizQuestion, { type: "single" }> {
  return {
    type: "single",
    id: "single-1",
    prompt: "Pick one",
    choices: [
      { id: "choice-a", content: "A", correct: false },
      { id: "choice-b", content: "B", correct: true },
    ],
    ...overrides,
  };
}

function multipleChoice(
  overrides: Partial<Extract<QuizQuestion, { type: "multi" }>> = {},
): Extract<QuizQuestion, { type: "multi" }> {
  return {
    type: "multi",
    id: "multi-1",
    prompt: "Pick all that apply",
    choices: [
      { id: "choice-a", content: "A", correct: true },
      { id: "choice-b", content: "B", correct: false },
      { id: "choice-c", content: "C", correct: true },
    ],
    ...overrides,
  };
}

function trueFalseQuestion(
  overrides: Partial<Extract<QuizQuestion, { type: "truefalse" }>> = {},
): Extract<QuizQuestion, { type: "truefalse" }> {
  return {
    type: "truefalse",
    id: "truefalse-1",
    prompt: "True or false?",
    choices: [
      { id: "true", content: "True", correct: false },
      { id: "false", content: "False", correct: true },
    ],
    ...overrides,
  };
}

function freeTextQuestion(
  overrides: Partial<Extract<QuizQuestion, { type: "freetext" }>> = {},
): Extract<QuizQuestion, { type: "freetext" }> {
  return {
    type: "freetext",
    id: "freetext-1",
    prompt: "Type the answer",
    answer: {
      expected: "New York",
    },
    ...overrides,
  };
}

function quiz(items: QuizDefinition["items"]): QuizDefinition {
  return {
    id: "quiz-1",
    title: "Quiz",
    items,
  };
}

test("gradeAnswer grades single choices and rejects unknown or invalid submissions", () => {
  const question = singleChoice();

  expect(gradeAnswer(question, "choice-b")).toEqual({
    correct: true,
    submitted: "choice-b",
    expected: "choice-b",
  });
  expect(gradeAnswer(question, "choice-a")).toEqual({
    correct: false,
    submitted: "choice-a",
    expected: "choice-b",
  });
  expect(gradeAnswer(question, "missing").error).toBe("unknown-choice");
  expect(gradeAnswer(question, ["choice-b"]).error).toBe("invalid-answer-shape");
});

test("gradeAnswer treats multi-choice submissions as an exact order-independent set", () => {
  const question = multipleChoice();

  expect(gradeAnswer(question, ["choice-c", "choice-a", "choice-a"])).toEqual({
    correct: true,
    submitted: ["choice-a", "choice-c"],
    expected: ["choice-a", "choice-c"],
  });
  expect(gradeAnswer(question, ["choice-a"]).correct).toBe(false);
  expect(gradeAnswer(question, ["choice-a", "choice-b", "choice-c"]).correct).toBe(false);
  expect(gradeAnswer(question, ["unknown"]).error).toBe("unknown-choice");
  expect(gradeAnswer(question, "choice-a" as never).error).toBe("invalid-answer-shape");
});

test("gradeAnswer treats true-false like single choice using the selected choice id", () => {
  const question = trueFalseQuestion();

  expect(gradeAnswer(question, "false").correct).toBe(true);
  expect(gradeAnswer(question, "true").correct).toBe(false);
  expect(gradeAnswer(question, "missing").error).toBe("unknown-choice");
  expect(gradeAnswer(question, false as never).error).toBe("invalid-answer-shape");
});

test("gradeAnswer normalizes free text and honors case-sensitive matching", () => {
  const question = freeTextQuestion();
  const caseSensitiveQuestion = freeTextQuestion({
    id: "freetext-2",
    answer: {
      expected: "Newton",
      caseSensitive: true,
    },
  });

  expect(gradeAnswer(question, "  NEW   york ")).toEqual({
    correct: true,
    submitted: "new york",
    expected: "new york",
  });
  expect(gradeAnswer(caseSensitiveQuestion, "newton")).toEqual({
    correct: false,
    submitted: "newton",
    expected: "Newton",
  });
  expect(gradeAnswer(question, ["New York"] as never).error).toBe("invalid-answer-shape");
});

test("scoreQuiz grades questions from submitted answers and ignores info items", () => {
  const single = singleChoice();
  const text = freeTextQuestion({
    id: "freetext-2",
    answer: {
      expected: "Newton",
      caseSensitive: true,
    },
  });
  const definition = quiz([
    {
      type: "info",
      id: "info-1",
      content: "Read this first",
    },
    single,
    text,
  ]);

  expect(
    scoreQuiz(definition, {
      [single.id]: "choice-b",
      [text.id]: "newton",
    }),
  ).toEqual({
    correct: 1,
    total: 2,
    answers: {
      [single.id]: "choice-b",
      [text.id]: "newton",
    },
    grades: {
      [single.id]: {
        correct: true,
        submitted: "choice-b",
        expected: "choice-b",
      },
      [text.id]: {
        correct: false,
        submitted: "newton",
        expected: "Newton",
      },
    } satisfies Record<string, GradeResult>,
  });
});
