import { expect, test } from "bun:test";
import React from "react";

import type {
  QuizChoice,
  QuizDefinition,
  QuizQuestion,
} from "../../registry/quiz/lib/model";
import { validateQuizDefinition } from "../../registry/quiz/lib/validation";

function singleChoice(overrides: Partial<Extract<QuizQuestion, { type: "single" }>> = {}): Extract<QuizQuestion, { type: "single" }> {
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
    ],
    ...overrides,
  };
}

function trueFalse(
  overrides: Partial<Extract<QuizQuestion, { type: "truefalse" }>> = {},
): Extract<QuizQuestion, { type: "truefalse" }> {
  return {
    type: "truefalse",
    id: "truefalse-1",
    prompt: "True or false?",
    choices: [
      { id: "choice-true", content: "True", correct: true },
      { id: "choice-false", content: "False", correct: false },
    ],
    ...overrides,
  };
}

function freeText(
  overrides: Partial<Extract<QuizQuestion, { type: "freetext" }>> = {},
): Extract<QuizQuestion, { type: "freetext" }> {
  return {
    type: "freetext",
    id: "freetext-1",
    prompt: "Type the answer",
    answer: {
      expected: "answer",
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

function issueCodes(definition: QuizDefinition): string[] {
  return validateQuizDefinition(definition).map((issue) => issue.code);
}

test("validateQuizDefinition accepts a quiz with info and every question kind", () => {
  const definition = quiz([
    {
      type: "info",
      id: "info-1",
      content: "Read this first",
    },
    singleChoice(),
    multipleChoice(),
    trueFalse(),
    freeText(),
  ]);

  expect(validateQuizDefinition(definition)).toEqual([]);
});

test("validateQuizDefinition requires non-empty quiz and item ids", () => {
  const definition = {
    ...quiz([
      {
        type: "info" as const,
        id: "",
        content: "Info",
      },
      singleChoice(),
    ]),
    id: "",
  };

  expect(issueCodes(definition)).toEqual(
    expect.arrayContaining(["quiz.id.empty", "quiz.item.id.empty"]),
  );
});

test("validateQuizDefinition rejects duplicate item ids and duplicate choice ids", () => {
  const duplicateChoices: QuizChoice[] = [
    { id: "same-choice", content: "A", correct: true },
    { id: "same-choice", content: "B", correct: false },
  ];
  const definition = quiz([
    {
      type: "info",
      id: "same-item",
      content: "Info",
    },
    singleChoice({
      id: "same-item",
      choices: duplicateChoices,
    }),
  ]);

  expect(issueCodes(definition)).toEqual(
    expect.arrayContaining([
      "quiz.item.id.duplicate",
      "quiz.choice.id.duplicate",
    ]),
  );
});

test("validateQuizDefinition requires at least one question but still allows info items", () => {
  const invalidDefinition = quiz([
    {
      type: "info",
      id: "info-1",
      content: "Only information",
    },
  ]);

  expect(issueCodes(invalidDefinition)).toContain("quiz.question.missing");
  expect(
    validateQuizDefinition(
      quiz([
        {
          type: "info",
          id: "info-1",
          content: "Read this first",
        },
        singleChoice(),
      ]),
    ),
  ).toEqual([]);
});

test("validateQuizDefinition requires exactly one correct single-choice answer", () => {
  const noneCorrect = singleChoice({
    choices: [
      { id: "choice-a", content: "A", correct: false },
      { id: "choice-b", content: "B", correct: false },
    ],
  });
  const twoCorrect = singleChoice({
    choices: [
      { id: "choice-a", content: "A", correct: true },
      { id: "choice-b", content: "B", correct: true },
    ],
  });

  expect(issueCodes(quiz([noneCorrect]))).toContain("quiz.single.correct-count");
  expect(issueCodes(quiz([twoCorrect]))).toContain("quiz.single.correct-count");
});

test("validateQuizDefinition requires at least one correct multiple-choice answer", () => {
  const definition = quiz([
    multipleChoice({
      choices: [
        { id: "choice-a", content: "A", correct: false },
        { id: "choice-b", content: "B", correct: false },
      ],
    }),
  ]);

  expect(issueCodes(definition)).toContain("quiz.multi.correct-count");
});

test("validateQuizDefinition enforces true-false labels as plain strings and a single correct answer", () => {
  const invalidLabels = quiz([
    trueFalse({
      choices: [
        { id: "choice-true", content: "Yes", correct: true },
        { id: "choice-false", content: "No", correct: false },
      ],
    }),
  ]);
  const invalidCorrectCount = quiz([
    trueFalse({
      choices: [
        { id: "choice-true", content: "True", correct: true },
        { id: "choice-false", content: "False", correct: true },
      ],
    }),
  ]);

  expect(issueCodes(invalidLabels)).toContain("quiz.truefalse.shape");
  expect(issueCodes(invalidCorrectCount)).toContain(
    "quiz.truefalse.correct-count",
  );
});

test("validateQuizDefinition requires exactly two true-false choices", () => {
  const missingChoiceIssues = validateQuizDefinition(
    quiz([
      trueFalse({
        choices: [{ id: "choice-true", content: "True", correct: true }],
      }),
    ]),
  );
  const extraChoiceIssues = validateQuizDefinition(
    quiz([
      trueFalse({
        choices: [
          { id: "choice-true", content: "True", correct: true },
          { id: "choice-false", content: "False", correct: false },
          { id: "choice-maybe", content: "Maybe", correct: false },
        ],
      }),
    ]),
  );

  expect(missingChoiceIssues).toEqual([
    {
      code: "quiz.truefalse.shape",
      message:
        'True/false question "truefalse-1" must contain exactly two plain-string choices labeled True and False.',
    },
  ]);
  expect(extraChoiceIssues).toEqual([
    {
      code: "quiz.truefalse.shape",
      message:
        'True/false question "truefalse-1" must contain exactly two plain-string choices labeled True and False.',
    },
  ]);
});

test("validateQuizDefinition requires true-false choices to use plain string content", () => {
  const issues = validateQuizDefinition(
    quiz([
      trueFalse({
        choices: [
          {
            id: "choice-true",
            content: React.createElement("span", null, "True"),
            correct: true,
          },
          { id: "choice-false", content: "False", correct: false },
        ],
      }),
    ]),
  );

  expect(issues).toEqual([
    {
      code: "quiz.truefalse.shape",
      message:
        'True/false question "truefalse-1" must contain exactly two plain-string choices labeled True and False.',
    },
  ]);
});

test("validateQuizDefinition requires a non-empty free-text expected answer", () => {
  const definition = quiz([
    freeText({
      answer: {
        expected: "  ",
      },
    }),
  ]);

  expect(issueCodes(definition)).toContain("quiz.freetext.answer.empty");
});

test("validateQuizDefinition returns structural issues without file paths or source positions", () => {
  const issues = validateQuizDefinition(
    quiz([
      {
        type: "info",
        id: "",
        content: "Info",
      },
    ]),
  );

  expect(issues[0]).toEqual({
    code: "quiz.question.missing",
    message: "Quiz must contain at least one question.",
  });
  expect(Object.keys(issues[0] ?? {})).toEqual(["code", "message"]);
  expect(JSON.stringify(issues)).not.toContain(".md:");
});
