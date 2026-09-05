import type { ReactNode } from "react";

export interface ContractQuizDefinition {
  id: string;
  title: string;
  items: ContractQuizItem[];
}

export type ContractQuizItem =
  | { type: "info"; id: string; content: ReactNode }
  | {
      type: "single" | "multi" | "truefalse";
      id: string;
      prompt: ReactNode;
      hint?: ReactNode;
      explanation?: ReactNode;
      choices: Array<{ id: string; content: ReactNode; correct: boolean }>;
    }
  | {
      type: "freetext";
      id: string;
      prompt: ReactNode;
      hint?: ReactNode;
      explanation?: ReactNode;
      answer: { expected: string; caseSensitive?: boolean };
    };

export const interactionQuiz: ContractQuizDefinition = {
  id: "interaction",
  title: "Quiz interaction",
  items: [
    {
      type: "single",
      id: "q-single",
      prompt: <span>Choose A</span>,
      hint: (
        <div>
          <span>It is the first choice.</span>
          <a href="#hint-details" aria-label="Hint details">
            Hint details
          </a>
          <select aria-label="Hint selection" defaultValue="one">
            <option value="one">One</option>
          </select>
          <textarea aria-label="Hint notes" defaultValue="Notes" />
          <input aria-label="Hint number" type="number" defaultValue="1" />
          <span aria-label="Editable hint" contentEditable />
        </div>
      ),
      explanation: <span>A is the expected answer.</span>,
      choices: [
        { id: "a", content: <span>A</span>, correct: true },
        { id: "b", content: <span>B</span>, correct: false },
      ],
    },
    {
      type: "info",
      id: "information",
      content: <p>Read this before continuing.</p>,
    },
    {
      type: "freetext",
      id: "q-free",
      prompt: <span>Type yes</span>,
      explanation: <span>Use the affirmative answer.</span>,
      answer: { expected: "yes", caseSensitive: false },
    },
  ],
};

export const choiceQuiz: ContractQuizDefinition = {
  id: "choice-types",
  title: "Choice types",
  items: [
    {
      type: "multi",
      id: "q-multi",
      prompt: "Choose both vowels",
      choices: [
        { id: "a", content: "A", correct: true },
        { id: "b", content: "B", correct: false },
        { id: "e", content: "E", correct: true },
      ],
    },
    {
      type: "truefalse",
      id: "q-boolean",
      prompt: "The sky is green",
      choices: [
        { id: "truth-choice", content: "True", correct: false },
        { id: "falsehood-choice", content: "False", correct: true },
      ],
    },
  ],
};

export const oneQuestionQuiz: ContractQuizDefinition = {
  id: "one-question",
  title: "One question",
  items: [
    {
      type: "single",
      id: "only-question",
      prompt: "Pick one",
      hint: "This answer should survive an equivalent rerender.",
      choices: [
        { id: "one", content: "One", correct: true },
        { id: "two", content: "Two", correct: false },
      ],
    },
  ],
};

export const literalMarkupQuiz: ContractQuizDefinition = {
  id: "literal-markup",
  title: "Literal markup",
  items: [
    {
      type: "single",
      id: "literal-question",
      prompt: "<strong>Choose literally</strong>",
      choices: [
        { id: "literal", content: "<em>Literal choice</em>", correct: true },
        { id: "other", content: "Other", correct: false },
      ],
    },
  ],
};

export const invalidQuiz: ContractQuizDefinition = {
  id: "invalid",
  title: "Invalid quiz",
  items: [],
};

export const blankChoiceIdQuiz: ContractQuizDefinition = {
  id: "blank-choice-id",
  title: "Blank choice ID",
  items: [
    {
      type: "single",
      id: "blank-choice-question",
      prompt: "Choose the only answer",
      choices: [{ id: "  ", content: "Only answer", correct: true }],
    },
  ],
};

export const spacedItemIdQuiz: ContractQuizDefinition = {
  id: "spaced-item-id",
  title: "Spaced item ID",
  items: [
    {
      type: "single",
      id: "question with spaces",
      prompt: "Choose the answer",
      hint: "This hint is labelled safely.",
      choices: [{ id: "answer", content: "Answer", correct: true }],
    },
  ],
};

export const replacementQuiz: ContractQuizDefinition = {
  id: "replacement-quiz",
  title: "Replacement quiz",
  items: [
    {
      type: "single",
      id: "replacement-question",
      prompt: "Choose the replacement answer",
      choices: [{ id: "replacement", content: "Replacement", correct: true }],
    },
  ],
};

export const sameIdReplacementQuiz: ContractQuizDefinition = {
  id: "one-question",
  title: "Same-ID replacement",
  items: [
    {
      type: "single",
      id: "replacement-question",
      prompt: "Choose the replacement answer",
      choices: [{ id: "replacement", content: "Replacement", correct: true }],
    },
  ],
};

export const blockPromptQuiz: ContractQuizDefinition = {
  id: "block-prompt",
  title: "Block prompt",
  items: [
    {
      type: "single",
      id: "block-question",
      prompt: (
        <div data-block-prompt="">
          <p>Choose the block answer</p>
        </div>
      ),
      choices: [{ id: "block", content: "Block", correct: true }],
    },
  ],
};

export const blockChoiceQuiz: ContractQuizDefinition = {
  id: "block-choice",
  title: "Block choice",
  items: [
    {
      type: "single",
      id: "block-choice-question",
      prompt: "Choose the block answer",
      choices: [
        {
          id: "block",
          content: (
            <div data-block-choice="">
              <p>Block correct answer</p>
            </div>
          ),
          correct: true,
        },
        { id: "wrong", content: "Wrong answer", correct: false },
      ],
    },
  ],
};

export const multiBlockChoiceQuiz: ContractQuizDefinition = {
  id: "multi-block-choice",
  title: "Multi block choice",
  items: [
    {
      type: "multi",
      id: "multi-block-choice-question",
      prompt: "Choose both block answers",
      choices: [
        {
          id: "alpha",
          content: (
            <div data-multi-block-choice="alpha">
              <p>Alpha</p>
            </div>
          ),
          correct: true,
        },
        {
          id: "beta",
          content: (
            <div data-multi-block-choice="beta">
              <p>Beta</p>
            </div>
          ),
          correct: true,
        },
        { id: "wrong", content: "Wrong answer", correct: false },
      ],
    },
  ],
};

export const freeTextKeyboardQuiz: ContractQuizDefinition = {
  id: "free-text-keyboard",
  title: "Free-text keyboard",
  items: [
    {
      type: "freetext",
      id: "free-text",
      prompt: "Type yes",
      answer: { expected: "yes", caseSensitive: false },
    },
  ],
};
