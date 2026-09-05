import type {
  FreeTextQuestion,
  MultipleChoiceQuestion,
  SingleChoiceQuestion,
  TrueFalseQuestion,
} from "../../registry/quiz/lib/model";

const single: SingleChoiceQuestion = {
  type: "single",
  id: "single-1",
  prompt: "Pick one",
  choices: [
    { id: "choice-a", content: "A", correct: false },
    { id: "choice-b", content: "B", correct: true },
  ],
};

const multi: MultipleChoiceQuestion = {
  type: "multi",
  id: "multi-1",
  prompt: "Pick all that apply",
  choices: [
    { id: "choice-a", content: "A", correct: true },
    { id: "choice-b", content: "B", correct: false },
  ],
};

const trueFalse: TrueFalseQuestion = {
  type: "truefalse",
  id: "truefalse-1",
  prompt: "True or false?",
  choices: [
    { id: "choice-true", content: "True", correct: true },
    { id: "choice-false", content: "False", correct: false },
  ],
};

const freeText: FreeTextQuestion = {
  type: "freetext",
  id: "freetext-1",
  prompt: "Type the answer",
  answer: {
    expected: "answer",
  },
};

void [single, multi, trueFalse, freeText];
