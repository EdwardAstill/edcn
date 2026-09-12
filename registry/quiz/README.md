# Quiz

Standalone, uncontrolled quiz UI for React 19. It renders information steps,
single-choice, multiple-choice, true/false, and free-text questions and reports a
graded result when an attempt is complete. Readers can click the numbered question
grid to jump directly to any question without losing answers. Results become
available once every question is graded, regardless of the order answered.

## Organization

- `components/`: assembled quiz screens and demo.
- `ui/`: questionnaire controls and visual primitives.
- `lib/`: types, grading, session state, validation, and class-name utility.
- `styles/`: quiz stylesheet and Tailwind source declarations.

Installed files preserve these folders under `components/quiz/`.

## Install

```sh
bunx shadcn@latest add EdwardAstill/edcn/quiz
```

The command copies editable quiz source into your project. It may add React,
React DOM, `@shadcn/react`, `clsx`, and `tailwind-merge` as dependencies;
quizcn itself is not installed from npm.

The copied source requires a Tailwind CSS 4-compatible shadcn application and
its semantic theme tokens. Import the copied stylesheet from your application's
global Tailwind entry:

```css
@import "tailwindcss";
@import "@/components/quiz/styles/styles.css";
```

Import the copied source where you render the quiz:

```tsx
import { Quiz } from "@/components/quiz/components/Quiz";
import type { QuizDefinition, QuizResult } from "@/components/quiz/lib/model";
```

In React Server Component frameworks, render `Quiz` from a Client Component.

Questions accept an optional positive integer `index` (for example, `index: 8`).
The grid, active question header (`Question 8`), and results use that index.
Without it, numbering starts at 1 and counts questions only, excluding information steps.

## Model and completion result

Define choices with stable IDs. Single-choice, multiple-choice, and true/false
answers use those IDs; free-text answers use the configured expected string.

```tsx
const quiz: QuizDefinition = {
  id: "self-study",
  title: "Self-study check",
  items: [
    {
      type: "single",
      id: "capital",
      prompt: "What is the capital of France?",
      hint: "It is also called the City of Light.",
      explanation: "Paris has been France's capital since 987.",
      choices: [
        { id: "paris", content: "Paris", correct: true },
        { id: "lyon", content: "Lyon", correct: false },
      ],
    },
  ],
};

function handleComplete(result: QuizResult) {
  console.log(result.correct, result.total, result.answers, result.grades);
}

export function StudyQuiz() {
  return <Quiz quiz={quiz} onComplete={handleComplete} />;
}
```

`onComplete` runs once per completed attempt and receives the score, submitted
answers, and per-question grades. Restarting starts a fresh attempt. The
component owns its session state; controlled state, persistence, and analytics
are outside this component's API.

## Answer visibility

Correct choice flags and expected free-text answers are part of the client-side
`QuizDefinition`. This is appropriate for self-study and immediate feedback,
but it does not provide server-side answer secrecy for high-stakes assessment.
The editable example in `examples/quiz/quiz-demo.tsx` demonstrates every item
type.
