import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  blankChoiceIdQuiz,
  blockChoiceQuiz,
  blockPromptQuiz,
  choiceQuiz,
  freeTextKeyboardQuiz,
  interactionQuiz,
  invalidQuiz,
  literalMarkupQuiz,
  multiBlockChoiceQuiz,
  oneQuestionQuiz,
  replacementQuiz,
  sameIdReplacementQuiz,
  spacedItemIdQuiz,
  type ContractQuizDefinition,
} from "./fixtures";
import { installHappyDom } from "./happy-dom";

interface ContractGradeResult {
  correct: boolean;
  submitted: string | string[];
  expected: string | string[];
  error?: "invalid-answer-shape" | "unknown-choice";
}

interface ContractQuizResult {
  correct: number;
  total: number;
  answers: Readonly<Record<string, string | string[]>>;
  grades: Readonly<Record<string, ContractGradeResult>>;
}

interface ContractQuizProps {
  quiz: ContractQuizDefinition;
  onComplete?: (result: ContractQuizResult) => void;
}

export type RenderQuiz = (props: ContractQuizProps) => ReactElement;

export function runQuizContract(renderQuiz: RenderQuiz): void {
  const roots: Root[] = [];
  let restoreDom: (() => void) | undefined;

  beforeAll(() => {
    restoreDom = installHappyDom();
  });

  afterEach(async () => {
    await act(async () => {
      for (const root of roots.splice(0)) root.unmount();
    });
    document.body.replaceChildren();
  });

  afterAll(() => {
    restoreDom?.();
  });

  const mount = async (element: ReactElement): Promise<HTMLElement> => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => root.render(element));
    return container;
  };

  const mountAnsweredInteraction = async (): Promise<{
    container: HTMLElement;
    firstChoice: HTMLInputElement;
  }> => {
    const container = await mount(renderQuiz({ quiz: interactionQuiz }));
    const firstChoice = findInput(
      container,
      'input[type="radio"][value="a"]',
    );
    await act(async () => firstChoice.click());
    return { container, firstChoice };
  };

  test("handles deliberate submission, information, review, results, restart, and completion callbacks", async () => {
    const completions: ContractQuizResult[] = [];
    const render = () =>
      renderQuiz({
        quiz: interactionQuiz,
        onComplete: (result) => completions.push(result),
      });
    const container = await mount(render());

    expect(container.textContent).toContain("Question 1");
    expect(findButton(container, "Check answer").disabled).toBe(true);
    const firstStep = activeStep(container);
    expect(firstStep.dataset.quizStep).toBe("q-single");

    await act(async () => {
      container.querySelector("form")?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(activeStep(container).dataset.quizStep).toBe("q-single");

    await act(async () => findButton(container, "Show hint").click());
    expect(findButton(container, "Hide hint").getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(container.textContent).toContain("It is the first choice.");
    await act(async () => findButton(container, "Hide hint").click());
    expect(container.textContent).not.toContain("It is the first choice.");
    await act(async () => findButton(container, "Show hint").click());

    const firstChoice = findInput(container, 'input[type="radio"][value="a"]');
    await act(async () => firstChoice.click());
    expect(firstChoice.checked).toBe(true);
    expect(findButton(container, "Check answer").disabled).toBe(false);
    expect(container.textContent).not.toContain("Correct.");

    await act(async () => findButton(container, "Hide hint").click());
    const hintEnter = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    await act(async () => {
      findButton(container, "Show hint").dispatchEvent(hintEnter);
    });
    expect(hintEnter.defaultPrevented).toBe(false);
    expect(container.textContent).not.toContain("Correct.");

    await act(async () => {
      firstChoice.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(container.textContent).toContain("Correct.");
    expect(container.textContent).toContain("A is the expected answer.");
    expect(firstChoice.disabled).toBe(true);

    await act(async () => {
      activeStep(container).dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(activeStep(container).dataset.quizStep).toBe("information");
    expect(document.activeElement).toBe(activeStep(container));
    expect(container.textContent).toContain("Read this before continuing.");
    expect(findButton(container, "Continue").disabled).toBe(false);

    await act(async () => {
      activeStep(container).dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(activeStep(container).dataset.quizStep).toBe("q-free");
    expect(document.activeElement).toBe(activeStep(container));
    const freeText = findInput(container, 'input[type="text"]');
    expect(findButton(container, "Check answer").disabled).toBe(true);
    for (const key of ["ArrowLeft", "ArrowRight"]) {
      const editingArrow = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      await act(async () => freeText.dispatchEvent(editingArrow));
      expect(editingArrow.defaultPrevented).toBe(false);
      expect(activeStep(container).dataset.quizStep).toBe("q-free");
    }
    await setInput(freeText, "no");
    expect(findButton(container, "Check answer").disabled).toBe(false);
    await act(async () => findButton(container, "Check answer").click());
    expect(container.textContent).toContain("Incorrect.");
    expect(container.textContent).toContain("Expected answer: yes");
    const inlineExpectedAnswer = Array.from(
      findElement<HTMLElement>(activeStep(container), '[role="status"]').querySelectorAll(
        "p",
      ),
    ).find(
      (paragraph) =>
        paragraph.textContent?.replace(/\s+/g, " ").trim() ===
        "Expected answer: yes",
    );
    expect(inlineExpectedAnswer).not.toBeUndefined();
    expect(inlineExpectedAnswer?.childElementCount).toBe(0);
    expect(container.textContent).toContain("Use the affirmative answer.");
    expect(freeText.disabled).toBe(true);

    await act(async () => findButton(container, "Previous").click());
    expect(activeStep(container).dataset.quizStep).toBe("information");
    await act(async () => findButton(container, "Previous").click());
    expect(activeStep(container).dataset.quizStep).toBe("q-single");
    const reviewedChoice = findInput(
      container,
      'input[type="radio"][value="a"]',
    );
    expect(reviewedChoice.checked).toBe(true);
    expect(reviewedChoice.disabled).toBe(true);
    expect(container.textContent).toContain("Correct.");
    expect(container.textContent).toContain("A is the expected answer.");

    await act(async () => findButton(container, "Next").click());
    await act(async () => findButton(container, "Continue").click());
    await act(async () => findButton(container, "View results").click());

    const resultsHeading = findHeading(container, "Quiz interaction: results");
    expect(document.activeElement).toBe(resultsHeading);
    expect(container.textContent).toContain("1 / 2");
    expect(resultOutcomes(container)).toEqual([
      ["1. Choose A", "Correct"],
      ["2. Type yes", "Incorrect"],
    ]);
    expect(completions).toEqual([
      {
        correct: 1,
        total: 2,
        answers: { "q-single": "a", "q-free": "no" },
        grades: {
          "q-single": { correct: true, submitted: "a", expected: "a" },
          "q-free": { correct: false, submitted: "no", expected: "yes" },
        },
      },
    ]);

    const root = roots[0];
    await act(async () => root?.render(render()));
    expect(completions).toHaveLength(1);

    await act(async () => findButton(container, "Restart quiz").click());
    const restartedStep = activeStep(container);
    expect(restartedStep.dataset.quizStep).toBe("q-single");
    expect(document.activeElement).toBe(restartedStep);
    expect(container.textContent).not.toContain("It is the first choice.");
    expect(completions).toHaveLength(1);

    await act(async () =>
      findInput(container, 'input[type="radio"][value="b"]').click(),
    );
    await act(async () => findButton(container, "Check answer").click());
    await act(async () => findButton(container, "Next").click());
    await act(async () => findButton(container, "Continue").click());
    await setInput(findInput(container, 'input[type="text"]'), "yes");
    await act(async () => findButton(container, "Check answer").click());
    await act(async () => findButton(container, "View results").click());

    expect(completions).toHaveLength(2);
    expect(completions[1]).toEqual({
      correct: 1,
      total: 2,
      answers: { "q-single": "b", "q-free": "yes" },
      grades: {
        "q-single": { correct: false, submitted: "b", expected: "a" },
        "q-free": { correct: true, submitted: "yes", expected: "yes" },
      },
    });
  });

  test("uses native multiple-choice and true/false controls with choice IDs", async () => {
    const container = await mount(renderQuiz({ quiz: choiceQuiz }));
    const multiInputs = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );
    expect(multiInputs.map((input) => input.value)).toEqual(["a", "b", "e"]);
    await act(async () => {
      multiInputs[0]?.click();
      multiInputs[2]?.click();
    });
    await act(async () => findButton(container, "Check answer").click());
    expect(container.textContent).toContain("Correct.");
    expect(multiInputs.every((input) => input.disabled)).toBe(true);

    await act(async () => findButton(container, "Next").click());
    const trueFalseInputs = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    ).filter((input) => !input.disabled);
    expect(trueFalseInputs.map((input) => input.value)).toEqual([
      "truth-choice",
      "falsehood-choice",
    ]);
    await act(async () => trueFalseInputs[1]?.click());
    await act(async () => findButton(container, "Check answer").click());
    expect(container.textContent).toContain("Correct.");
    expect(trueFalseInputs.every((input) => input.disabled)).toBe(true);
    await act(async () => findButton(container, "View results").click());
    expect(container.textContent).toContain("2 / 2");
  });

  test("leaves Enter from a link to native behavior", async () => {
    const { container } = await mountAnsweredInteraction();
    await act(async () => findButton(container, "Show hint").click());
    const link = findElement<HTMLAnchorElement>(
      container,
      'a[aria-label="Hint details"]',
    );

    const event = await pressKey(link, "Enter");

    expect(event.defaultPrevented).toBe(false);
    expect(container.textContent).not.toContain("Correct.");
    expect(activeStep(container).dataset.quizStep).toBe("q-single");
  });

  test("honors descendant cancellation before grading Enter", async () => {
    const { container, firstChoice } = await mountAnsweredInteraction();
    firstChoice.addEventListener("keydown", (event) => event.preventDefault(), {
      once: true,
    });

    const event = await pressKey(firstChoice, "Enter");

    expect(event.defaultPrevented).toBe(true);
    expect(container.textContent).not.toContain("Correct.");
    expect(activeStep(container).dataset.quizStep).toBe("q-single");
  });

  for (const guardedEnter of [
    { label: "composition", init: { isComposing: true } },
    { label: "legacy composition", init: {}, keyCode: 229 },
    { label: "repeat", init: { repeat: true } },
    { label: "Control", init: { ctrlKey: true } },
    { label: "Meta", init: { metaKey: true } },
    { label: "Alt", init: { altKey: true } },
    { label: "Shift", init: { shiftKey: true } },
  ] satisfies Array<{
    label: string;
    init: KeyboardEventInit;
    keyCode?: number;
  }>) {
    test(`does not grade ${guardedEnter.label} Enter`, async () => {
      const { container, firstChoice } = await mountAnsweredInteraction();

      await pressKey(
        firstChoice,
        "Enter",
        guardedEnter.init,
        guardedEnter.keyCode,
      );

      expect(container.textContent).not.toContain("Correct.");
      expect(activeStep(container).dataset.quizStep).toBe("q-single");
    });
  }

  test("does not skip an answered ungraded question with ArrowRight", async () => {
    const { container } = await mountAnsweredInteraction();

    await pressKey(activeStep(container), "ArrowRight");

    expect(container.textContent).not.toContain("Correct.");
    expect(activeStep(container).dataset.quizStep).toBe("q-single");
  });

  test("honors descendant cancellation before ArrowRight navigation", async () => {
    const { container } = await mountAnsweredInteraction();
    await act(async () => findButton(container, "Check answer").click());
    const step = activeStep(container);
    step.addEventListener("keydown", (event) => event.preventDefault(), {
      once: true,
    });

    const event = await pressKey(step, "ArrowRight");

    expect(event.defaultPrevented).toBe(true);
    expect(activeStep(container).dataset.quizStep).toBe("q-single");
  });

  for (const guardedArrow of [
    { label: "composition", init: { isComposing: true } },
    { label: "legacy composition", init: {}, keyCode: 229 },
    { label: "repeat", init: { repeat: true } },
    { label: "Control", init: { ctrlKey: true } },
    { label: "Meta", init: { metaKey: true } },
    { label: "Alt", init: { altKey: true } },
    { label: "Shift", init: { shiftKey: true } },
  ] satisfies Array<{
    label: string;
    init: KeyboardEventInit;
    keyCode?: number;
  }>) {
    test(`does not navigate with ${guardedArrow.label} ArrowRight`, async () => {
      const { container } = await mountAnsweredInteraction();
      await act(async () => findButton(container, "Check answer").click());

      await pressKey(
        activeStep(container),
        "ArrowRight",
        guardedArrow.init,
        guardedArrow.keyCode,
      );

      expect(activeStep(container).dataset.quizStep).toBe("q-single");
    });
  }

  for (const editingControl of [
    { label: "select", selector: 'select[aria-label="Hint selection"]' },
    { label: "textarea", selector: 'textarea[aria-label="Hint notes"]' },
    { label: "number input", selector: 'input[aria-label="Hint number"]' },
    {
      label: "contenteditable",
      selector: '[contenteditable="true"][aria-label="Editable hint"]',
    },
  ]) {
    test(`preserves ArrowRight editing in a ${editingControl.label}`, async () => {
      const { container } = await mountAnsweredInteraction();
      await act(async () => findButton(container, "Show hint").click());
      await act(async () => findButton(container, "Check answer").click());
      const control = findElement<HTMLElement>(
        container,
        editingControl.selector,
      );
      if (editingControl.label === "contenteditable") {
        Object.defineProperty(control, "isContentEditable", {
          configurable: true,
          value: true,
        });
      }

      const event = await pressKey(control, "ArrowRight");

      expect(event.defaultPrevented).toBe(false);
      expect(activeStep(container).dataset.quizStep).toBe("q-single");
    });
  }

  test("preserves native radio ArrowRight behavior", async () => {
    const { container, firstChoice } = await mountAnsweredInteraction();

    const event = await pressKey(firstChoice, "ArrowRight");

    expect(event.defaultPrevented).toBe(false);
    expect(activeStep(container).dataset.quizStep).toBe("q-single");
  });

  for (const submitModifier of [
    { label: "Control", init: { ctrlKey: true } },
    { label: "Meta", init: { metaKey: true } },
  ]) {
    test(`${submitModifier.label}+Enter cannot bypass Quiz grading`, async () => {
      const container = await mount(renderQuiz({ quiz: freeTextKeyboardQuiz }));
      const freeText = findInput(container, 'input[type="text"]');
      await setInput(freeText, "yes");

      await pressKey(freeText, "Enter", submitModifier.init);

      expect(container.textContent).not.toContain("Correct.");
      expect(container.textContent).not.toContain("results");
      expect(activeStep(container).dataset.quizStep).toBe("free-text");
      expect(findButton(container, "Check answer").disabled).toBe(false);
    });
  }

  test("renders string content literally instead of treating it as HTML", async () => {
    const container = await mount(renderQuiz({ quiz: literalMarkupQuiz }));
    expect(container.textContent).toContain("<strong>Choose literally</strong>");
    expect(container.textContent).toContain("<em>Literal choice</em>");
    expect(container.querySelector("strong")).toBeNull();
    expect(container.querySelector("em")).toBeNull();
  });

  test("keeps ARIA IDREFs valid when an item ID contains whitespace", async () => {
    const container = await mount(renderQuiz({ quiz: spacedItemIdQuiz }));
    const step = activeStep(container);
    const headingId = step.getAttribute("aria-labelledby");

    expect(headingId?.trim().split(/\s+/)).toHaveLength(1);
    expect(document.getElementById(headingId ?? "")).not.toBeNull();

    await act(async () => findButton(container, "Show hint").click());
    const hintId = findButton(container, "Hide hint").getAttribute("aria-controls");
    expect(hintId?.trim().split(/\s+/)).toHaveLength(1);
    expect(document.getElementById(hintId ?? "")).not.toBeNull();
  });

  test("resets to the first step when rerendered with another quiz", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => root.render(renderQuiz({ quiz: oneQuestionQuiz })));
    await act(async () =>
      findInput(container, 'input[type="radio"][value="one"]').click(),
    );

    await act(async () => root.render(renderQuiz({ quiz: replacementQuiz })));

    expect(activeStep(container).dataset.quizStep).toBe("replacement-question");
    expect(
      findInput(container, 'input[type="radio"][value="replacement"]').checked,
    ).toBe(false);
    expect(findButton(container, "Check answer").disabled).toBe(true);
  });

  test("preserves an equivalent definition but resets a same-ID replacement", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => root.render(renderQuiz({ quiz: oneQuestionQuiz })));
    await act(async () =>
      findInput(container, 'input[type="radio"][value="one"]').click(),
    );
    await act(async () => findButton(container, "Show hint").click());

    const equivalentQuiz: ContractQuizDefinition = {
      ...oneQuestionQuiz,
      title: "Equivalent presentation update",
      items: oneQuestionQuiz.items.map((item) => ({ ...item })),
    };
    await act(async () => root.render(renderQuiz({ quiz: equivalentQuiz })));

    expect(
      findInput(container, 'input[type="radio"][value="one"]').checked,
    ).toBe(true);
    expect(container.textContent).toContain(
      "This answer should survive an equivalent rerender.",
    );

    await act(async () => findButton(container, "Check answer").click());
    await act(async () => findButton(container, "View results").click());
    expect(container.textContent).toContain(
      "Equivalent presentation update: results",
    );

    await act(async () =>
      root.render(renderQuiz({ quiz: sameIdReplacementQuiz })),
    );

    expect(activeStep(container).dataset.quizStep).toBe("replacement-question");
    expect(
      findInput(container, 'input[type="radio"][value="replacement"]').checked,
    ).toBe(false);
    expect(findButton(container, "Check answer").disabled).toBe(true);
    expect(container.textContent).not.toContain("Correct.");
    expect(container.textContent).not.toContain(
      "This answer should survive an equivalent rerender.",
    );
  });

  test("renders block prompts in block-safe labelled containers", async () => {
    const container = await mount(renderQuiz({ quiz: blockPromptQuiz }));
    const step = activeStep(container);
    const headingId = step.getAttribute("aria-labelledby");
    const questionPrompt = container.querySelector<HTMLElement>(
      "[data-block-prompt]",
    );

    expect(questionPrompt).not.toBeNull();
    expect(questionPrompt?.closest("legend")).toBeNull();
    expect(document.getElementById(headingId ?? "")?.contains(questionPrompt)).toBe(
      true,
    );

    await act(async () =>
      findInput(container, 'input[type="radio"][value="block"]').click(),
    );
    await act(async () => findButton(container, "Check answer").click());
    await act(async () => findButton(container, "View results").click());

    const resultPrompt = container.querySelector<HTMLElement>(
      "[data-block-prompt]",
    );
    expect(resultPrompt).not.toBeNull();
    expect(resultPrompt?.closest("span")).toBeNull();
  });

  test("renders block choices in flow containers", async () => {
    const container = await mount(renderQuiz({ quiz: blockChoiceQuiz }));
    const blockChoice = findElement<HTMLElement>(
      container,
      "[data-block-choice]",
    );
    const choiceRow = findElement<HTMLElement>(
      container,
      '[data-slot="questionnaire-choice"]',
    );

    expect(choiceRow.contains(blockChoice)).toBe(true);
    expect(blockChoice.closest("label, span, p")).toBeNull();
  });

  test("gives every choice input one unique accessible content target across quiz instances", async () => {
    const container = await mount(
      <div>
        <section data-contract-instance="first">
          {renderQuiz({ quiz: blockChoiceQuiz })}
        </section>
        <section data-contract-instance="second">
          {renderQuiz({ quiz: blockChoiceQuiz })}
        </section>
      </div>,
    );
    const firstNames = choiceAccessibleNames(findInstance(container, "first"));
    const secondNames = choiceAccessibleNames(
      findInstance(container, "second"),
    );

    expect(
      firstNames.filter((id) => secondNames.includes(id)),
    ).toEqual([]);
  });

  test("keeps choice accessible content targets stable across equivalent rerender and restart", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => root.render(renderQuiz({ quiz: blockChoiceQuiz })));
    const initialNames = choiceAccessibleNames(container);
    const equivalentQuiz: ContractQuizDefinition = {
      ...blockChoiceQuiz,
      title: "Equivalent block choice presentation",
      items: blockChoiceQuiz.items.map((item) => ({ ...item })),
    };

    await act(async () => root.render(renderQuiz({ quiz: equivalentQuiz })));
    expect(choiceAccessibleNames(container)).toEqual(initialNames);

    await act(async () =>
      findInput(container, 'input[type="radio"][value="wrong"]').click(),
    );
    await act(async () => findButton(container, "Check answer").click());
    await act(async () => findButton(container, "View results").click());
    await act(async () => findButton(container, "Restart quiz").click());

    expect(choiceAccessibleNames(container)).toEqual(initialNames);
  });

  test("grades a selected block choice and renders its expected answer in a flow container", async () => {
    const container = await mount(renderQuiz({ quiz: blockChoiceQuiz }));
    await act(async () =>
      findInput(container, 'input[type="radio"][value="wrong"]').click(),
    );
    await act(async () => findButton(container, "Check answer").click());
    const expectedChoice = findElement<HTMLElement>(
      container,
      '[role="status"] [data-block-choice]',
    );

    expect(container.textContent).toContain("Incorrect.");
    expect(expectedChoice.closest("label, span, p")).toBeNull();
    expect(expectedChoice.textContent).toContain("Block correct answer");

    await act(async () => findButton(container, "View results").click());
    await act(async () => findButton(container, "Restart quiz").click());
    const correctChoice = findInput(
      container,
      'input[type="radio"][value="block"]',
    );
    await act(async () => correctChoice.click());
    await act(async () => findButton(container, "Check answer").click());

    expect(container.textContent).toContain("Correct.");
    expect(correctChoice.disabled).toBe(true);
  });

  test("renders multiple block expected answers as ordered flow list items", async () => {
    const container = await mount(renderQuiz({ quiz: multiBlockChoiceQuiz }));
    await act(async () =>
      findInput(container, 'input[type="checkbox"][value="wrong"]').click(),
    );
    await act(async () => findButton(container, "Check answer").click());

    const expectedAnswers = findElement<HTMLElement>(
      activeStep(container),
      '[data-slot="quiz-expected-answers"]',
    );
    const answerRows = Array.from(expectedAnswers.children).filter(
      (child): child is HTMLLIElement =>
        child.tagName === "LI" &&
        child.getAttribute("data-slot") === "quiz-expected-answer",
    );
    const alpha = findElement<HTMLElement>(
      expectedAnswers,
      '[data-multi-block-choice="alpha"]',
    );
    const beta = findElement<HTMLElement>(
      expectedAnswers,
      '[data-multi-block-choice="beta"]',
    );

    expect(expectedAnswers.tagName).toBe("UL");
    expect(answerRows).toHaveLength(2);
    expect(answerRows.map((row) => row.textContent?.trim())).toEqual([
      "Alpha",
      "Beta",
    ]);
    expect(alpha.closest("label, span, p")).toBeNull();
    expect(beta.closest("label, span, p")).toBeNull();
    expect(
      Array.from(expectedAnswers.childNodes).filter(
        (node) =>
          node.nodeType === Node.TEXT_NODE && node.textContent?.trim() !== "",
      ),
    ).toHaveLength(0);
    await act(async () => findButton(container, "View results").click());
  });

  test("isolates control IDs, names, selection, and focus across two quizzes", async () => {
    const container = await mount(
      <div>
        <section data-contract-instance="first">
          {renderQuiz({ quiz: oneQuestionQuiz })}
        </section>
        <section data-contract-instance="second">
          {renderQuiz({ quiz: oneQuestionQuiz })}
        </section>
      </div>,
    );
    const first = findInstance(container, "first");
    const second = findInstance(container, "second");
    const firstInput = findInput(first, 'input[type="radio"][value="one"]');
    const secondInput = findInput(second, 'input[type="radio"][value="one"]');

    expect(firstInput.id).not.toBe(secondInput.id);
    expect(firstInput.name).not.toBe(secondInput.name);
    expect(activeStep(first).getAttribute("aria-labelledby")).not.toBe(
      activeStep(second).getAttribute("aria-labelledby"),
    );
    await act(async () => firstInput.click());
    expect(firstInput.checked).toBe(true);
    expect(secondInput.checked).toBe(false);

    await act(async () => findButton(first, "Check answer").click());
    await act(async () => findButton(first, "View results").click());
    const firstHeading = findHeading(first, "One question: results");
    expect(document.activeElement).toBe(firstHeading);
    expect(second.textContent).toContain("Question 1");

    await act(async () => findButton(first, "Restart quiz").click());
    expect(document.activeElement).toBe(activeStep(first));
    expect(second.contains(document.activeElement)).toBe(false);

    await act(async () => secondInput.click());
    await act(async () => findButton(second, "Check answer").click());
    await act(async () => findButton(second, "View results").click());
    expect(document.activeElement).toBe(
      findHeading(second, "One question: results"),
    );
    await act(async () => findButton(second, "Restart quiz").click());
    expect(document.activeElement).toBe(activeStep(second));
    expect(first.contains(document.activeElement)).toBe(false);
  });

  test("keeps the package styling scope throughout every rendered quiz state", async () => {
    const container = await mount(renderQuiz({ quiz: oneQuestionQuiz }));
    const quizRoot = container.querySelector<HTMLElement>("[data-quiz-root]");

    expect(quizRoot?.classList.contains("cn-questionnaire")).toBe(true);
    await act(async () =>
      findInput(container, 'input[type="radio"][value="one"]').click(),
    );
    await act(async () => findButton(container, "Check answer").click());
    await act(async () => findButton(container, "View results").click());
    expect(quizRoot?.classList.contains("cn-questionnaire")).toBe(true);

    const unavailable = await mount(renderQuiz({ quiz: invalidQuiz }));
    expect(
      unavailable
        .querySelector<HTMLElement>('[role="alert"]')
        ?.classList.contains("cn-questionnaire"),
    ).toBe(true);
  });

  for (const mode of ["development", "production"] as const) {
    test(`fails closed with an accessible unavailable state in ${mode}`, async () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = mode;
      try {
        const container = await mount(renderQuiz({ quiz: invalidQuiz }));
        const alert = container.querySelector<HTMLElement>('[role="alert"]');
        expect(alert).not.toBeNull();
        expect(findHeading(container, "Quiz unavailable")).not.toBeNull();
        expect(alert?.textContent).toContain("Quiz unavailable");
        expect(container.querySelector("form")).toBeNull();
      } finally {
        if (previous === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previous;
      }
    });
  }

  test("fails closed when a correct choice ID is blank", async () => {
    const container = await mount(renderQuiz({ quiz: blankChoiceIdQuiz }));

    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain("Quiz unavailable");
    expect(container.querySelector("form")).toBeNull();
  });
}

function findButton(root: ParentNode, label: string): HTMLButtonElement {
  const button = Array.from(
    root.querySelectorAll<HTMLButtonElement>("button"),
  ).find(
    (candidate) =>
      !candidate.hidden && candidate.textContent?.trim() === label,
  );
  if (!button) throw new Error(`Button "${label}" not found`);
  return button;
}

function findInput(root: ParentNode, selector: string): HTMLInputElement {
  const input = root.querySelector<HTMLInputElement>(selector);
  if (!input) throw new Error(`Input "${selector}" not found`);
  return input;
}

function activeStep(root: ParentNode): HTMLElement {
  const step = root.querySelector<HTMLElement>(
    '[data-slot="questionnaire-item"][data-active]',
  );
  if (!step) throw new Error("Active quiz step not found");
  return step;
}

function findHeading(root: ParentNode, label: string): HTMLHeadingElement {
  const heading = Array.from(
    root.querySelectorAll<HTMLHeadingElement>("h1,h2,h3,h4,h5,h6"),
  ).find(
    (candidate) => candidate.textContent?.trim() === label,
  );
  if (!heading) throw new Error(`Heading "${label}" not found`);
  return heading;
}

function resultOutcomes(root: ParentNode): string[][] {
  return Array.from(root.querySelectorAll<HTMLLIElement>("li")).map(
    (item) =>
      Array.from(item.children).map(
        (child) => child.textContent?.replace(/\s+/g, " ").trim() ?? "",
      ),
  );
}

function findInstance(root: ParentNode, name: string): HTMLElement {
  const instance = root.querySelector<HTMLElement>(
    `[data-contract-instance="${name}"]`,
  );
  if (!instance) throw new Error(`Quiz instance "${name}" not found`);
  return instance;
}

function choiceAccessibleNames(root: ParentNode): string[] {
  const inputs = Array.from(
    root.querySelectorAll<HTMLInputElement>(
      '[data-slot="questionnaire-choice-input"]',
    ),
  );
  const names = inputs.map((input) => {
    const labelledBy = input.getAttribute("aria-labelledby")?.trim();
    const references = labelledBy ? labelledBy.split(/\s+/) : [];

    expect(references).toHaveLength(1);
    const [reference] = references;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[id]")).filter(
      (candidate) => candidate.id === reference,
    );
    expect(targets).toHaveLength(1);

    const target = targets[0];
    const choiceRow = input.closest<HTMLElement>(
      '[data-slot="questionnaire-choice"]',
    );
    const content = choiceRow?.querySelector<HTMLElement>(
      '[data-slot="questionnaire-choice-label"]',
    );
    if (!target || !content) {
      throw new Error("Choice input must reference its rendered content");
    }
    expect(target).toBe(content);
    expect(target.textContent?.trim()).toBe(content.textContent?.trim());

    return reference ?? "";
  });

  expect(inputs.length).toBeGreaterThan(0);
  expect(new Set(names).size).toBe(inputs.length);
  return names;
}

async function setInput(input: HTMLInputElement, value: string): Promise<void> {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function findElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Element "${selector}" not found`);
  return element;
}

async function pressKey(
  target: Element,
  key: string,
  init: KeyboardEventInit = {},
  keyCode?: number,
): Promise<KeyboardEvent> {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  if (keyCode !== undefined) {
    Object.defineProperty(event, "keyCode", { value: keyCode });
  }

  await act(async () => target.dispatchEvent(event));
  return event;
}
