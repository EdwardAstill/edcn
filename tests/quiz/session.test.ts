import { expect, test } from "bun:test";

import type { QuizDefinition, QuizQuestion, SubmittedAnswer } from "../../registry/quiz/lib/model";
import { createQuizSession, reduceQuizSession } from "../../registry/quiz/lib/session";

function singleChoice(
  overrides: Partial<Extract<QuizQuestion, { type: "single" }>> = {},
): Extract<QuizQuestion, { type: "single" }> {
  return {
    type: "single",
    id: "single-1",
    prompt: "Pick one",
    hint: "Try the second option",
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
      { id: "choice-true", content: "True", correct: false },
      { id: "choice-false", content: "False", correct: true },
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

function answer(
  definition: QuizDefinition,
  state: ReturnType<typeof createQuizSession>,
  itemId: string,
  submitted: SubmittedAnswer,
) {
  return reduceQuizSession(definition, state, {
    type: "answer",
    itemId,
    answer: submitted,
  });
}

test("createQuizSession starts on the first item and marks empty quizzes complete", () => {
  expect(
    createQuizSession(
      quiz([
        { type: "info", id: "info-1", content: "Read this first" },
        singleChoice(),
      ]),
    ),
  ).toEqual({
    activeItemId: "info-1",
    answers: {},
    grades: {},
    visibleHints: [],
    phase: "active",
  });

  expect(createQuizSession(quiz([]))).toEqual({
    activeItemId: "",
    answers: {},
    grades: {},
    visibleHints: [],
    phase: "complete",
  });
});

test("reduceQuizSession blocks forward progress until the active question is graded and locks graded answers", () => {
  const definition = quiz([
    { type: "info", id: "info-1", content: "Read this first" },
    singleChoice(),
    multipleChoice(),
  ]);

  let state = createQuizSession(definition);
  state = reduceQuizSession(definition, state, { type: "go-to", itemId: "single-1" });
  expect(state.activeItemId).toBe("single-1");

  state = answer(definition, state, "single-1", "choice-b");
  expect(state.answers).toEqual({ "single-1": "choice-b" });
  expect(state.grades).toEqual({});

  const blockedForward = reduceQuizSession(definition, state, {
    type: "go-to",
    itemId: "multi-1",
  });
  expect(blockedForward).toBe(state);

  const blockedSkip = reduceQuizSession(definition, state, {
    type: "go-to",
    itemId: "info-1",
  });
  expect(blockedSkip.activeItemId).toBe("info-1");

  state = reduceQuizSession(definition, state, { type: "submit", itemId: "single-1" });
  expect(state.grades["single-1"]).toEqual({
    correct: true,
    submitted: "choice-b",
    expected: "choice-b",
  });

  const lockedAnswer = answer(definition, state, "single-1", "choice-a");
  expect(lockedAnswer).toBe(state);

  const lockedSubmit = reduceQuizSession(definition, state, {
    type: "submit",
    itemId: "single-1",
  });
  expect(lockedSubmit).toBe(state);

  const next = reduceQuizSession(definition, state, { type: "go-to", itemId: "multi-1" });
  expect(next.activeItemId).toBe("multi-1");
});

test("reduceQuizSession retains answers and grades across navigation, toggles hints on the active item, completes only after grading every question, and restarts", () => {
  const definition = quiz([
    { type: "info", id: "info-1", content: "Read this first" },
    singleChoice(),
    trueFalseQuestion(),
    freeTextQuestion(),
  ]);

  let state = createQuizSession(definition);
  state = reduceQuizSession(definition, state, { type: "go-to", itemId: "single-1" });
  state = reduceQuizSession(definition, state, { type: "toggle-hint", itemId: "single-1" });
  expect(state.visibleHints).toEqual(["single-1"]);

  const wrongHintTarget = reduceQuizSession(definition, state, {
    type: "toggle-hint",
    itemId: "truefalse-1",
  });
  expect(wrongHintTarget).toBe(state);

  state = answer(definition, state, "single-1", "choice-a");
  state = reduceQuizSession(definition, state, { type: "submit", itemId: "single-1" });
  state = reduceQuizSession(definition, state, { type: "go-to", itemId: "truefalse-1" });
  state = answer(definition, state, "truefalse-1", "choice-false");
  state = reduceQuizSession(definition, state, { type: "submit", itemId: "truefalse-1" });
  state = reduceQuizSession(definition, state, { type: "go-to", itemId: "freetext-1" });

  expect(reduceQuizSession(definition, state, { type: "complete" })).toBe(state);

  state = answer(definition, state, "freetext-1", "  new   york ");
  state = reduceQuizSession(definition, state, { type: "submit", itemId: "freetext-1" });
  state = reduceQuizSession(definition, state, { type: "go-to", itemId: "single-1" });

  expect(state.answers).toEqual({
    "single-1": "choice-a",
    "truefalse-1": "choice-false",
    "freetext-1": "  new   york ",
  });
  expect(state.grades).toEqual({
    "single-1": {
      correct: false,
      submitted: "choice-a",
      expected: "choice-b",
    },
    "truefalse-1": {
      correct: true,
      submitted: "choice-false",
      expected: "choice-false",
    },
    "freetext-1": {
      correct: true,
      submitted: "new york",
      expected: "new york",
    },
  });
  expect(state.visibleHints).toEqual(["single-1"]);

  state = reduceQuizSession(definition, state, { type: "go-to", itemId: "freetext-1" });
  state = reduceQuizSession(definition, state, { type: "complete" });
  expect(state.phase).toBe("complete");

  const ignoredAfterComplete = reduceQuizSession(definition, state, {
    type: "go-to",
    itemId: "single-1",
  });
  expect(ignoredAfterComplete).toBe(state);

  expect(reduceQuizSession(definition, state, { type: "restart" })).toEqual(
    createQuizSession(definition),
  );
});
