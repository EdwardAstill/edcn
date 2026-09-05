import { Quiz } from "@/registry/quiz/components/Quiz";
import type { QuizDefinition, QuizResult } from "@/registry/quiz/lib/model";

export const description =
  "An independent quiz with information, choice, and free-text steps.";

const quiz: QuizDefinition = {
  id: "planets",
  title: "A short tour of the planets",
  items: [
    {
      type: "info",
      id: "welcome",
      content: "Answer each question, check your answer, then continue.",
    },
    {
      type: "single",
      id: "largest",
      prompt: "Which planet is the largest?",
      choices: [
        { id: "earth", content: "Earth", correct: false },
        { id: "jupiter", content: "Jupiter", correct: true },
      ],
      explanation: "Jupiter is the largest planet in the Solar System.",
    },
    {
      type: "multi",
      id: "rocky",
      prompt: "Which of these are rocky planets?",
      hint: "Choose every option that applies.",
      choices: [
        { id: "mercury", content: "Mercury", correct: true },
        { id: "venus", content: "Venus", correct: true },
        { id: "saturn", content: "Saturn", correct: false },
      ],
    },
    {
      type: "truefalse",
      id: "mars-moons",
      prompt: "Mars has two moons.",
      choices: [
        { id: "true", content: "True", correct: true },
        { id: "false", content: "False", correct: false },
      ],
    },
    {
      type: "freetext",
      id: "home",
      prompt: "Which planet is our home?",
      answer: { expected: "Earth", caseSensitive: false },
    },
  ],
};

function handleComplete(result: QuizResult): void {
  console.log("Quiz complete", result);
}

export function QuizDemo() {
  return <Quiz quiz={quiz} onComplete={handleComplete} />;
}
