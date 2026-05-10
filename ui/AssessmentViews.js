import { createAccessButton } from "./accessButton.js";
import { getAnswerButtonClass } from "./uiClasses.js";

const ANSWER_IMAGES = {
  0: { src: "images/happy.png", alt: "Happy" },
  1: { src: "images/smile.png", alt: "Smile" },
  2: { src: "images/neutral.png", alt: "Neutral" },
  3: { src: "images/sad.png", alt: "Sad" },
  4: { src: "images/crying.png", alt: "Crying" },
};

/** Build DOM screens for the assessment flow. */
export class AssessmentViews {
  /** Render the assessment selection menu. */
  renderMenu({ assessmentIndex, onSelectAssessment }) {
    const container = document.createElement("main");
    container.className = "screen screen--wide";

    const title = document.createElement("h1");
    title.className = "screen-title menu-title";
    title.textContent = "Choose an assessment";
    container.appendChild(title);

    const list = document.createElement("div");
    list.className = "assessment-menu";

    assessmentIndex.forEach((assessmentMeta) => {
      const button = document.createElement("button");
      button.className = "assessment-menu-button";
      button.textContent = assessmentMeta.title;

      const accessButton = createAccessButton(button, () => {
        onSelectAssessment(assessmentMeta.id);
      });

      list.appendChild(accessButton);
    });

    container.appendChild(list);
    return container;
  }

  /** Render the active assessment question. */
  renderAssessment({
    assessment,
    onAnswer,
    onGoHome,
    onMoveQuestion,
    onShowResult,
  }) {
    const question = assessment.currentQuestion();

    if (!question) {
      return this.renderMessage("No question found.");
    }

    const container = document.createElement("main");
    container.className = "screen screen--wide assessment-screen";

    const navigationSection = document.createElement("section");
    navigationSection.className = "assessment-nav-section";
    navigationSection.appendChild(
      this.createAssessmentNavigation({
        assessment,
        onGoHome,
        onMoveQuestion,
        onShowResult,
      }),
    );
    container.appendChild(navigationSection);

    const questionSection = document.createElement("section");
    questionSection.className = "assessment-question-section";

    const progress = document.createElement("p");
    progress.className = "assessment-progress";
    progress.textContent = `${assessment.questionIndex + 1} / ${
      assessment.questions.length
    }`;
    questionSection.appendChild(progress);

    const title = document.createElement("h1");
    title.className = "screen-title assessment-title";
    title.textContent = assessment.title;
    questionSection.appendChild(title);

    const questionLayout = document.createElement("div");
    questionLayout.className = "question-layout";

    const questionText = document.createElement("p");
    questionText.className = "question-text";
    questionText.textContent = question.question;
    questionLayout.appendChild(questionText);

    if (question.imageUrl) {
      const image = document.createElement("img");
      image.className = "question-image";
      image.src = question.imageUrl;
      image.alt = "";
      questionLayout.appendChild(image);
    }

    questionSection.appendChild(questionLayout);
    container.appendChild(questionSection);

    const answerSection = document.createElement("section");
    answerSection.className = "assessment-answer-section";

    const scaleDescriptions = document.createElement("div");
    scaleDescriptions.className = "scale-descriptions";

    getQuestionOptions(question).forEach(({ label }) => {
      const description = document.createElement("div");
      description.className = "scale-description";
      description.textContent = label;
      scaleDescriptions.appendChild(description);
    });

    answerSection.appendChild(scaleDescriptions);

    const options = document.createElement("div");
    options.className = "answer-options";

    getQuestionOptions(question).forEach(({ value, label }) => {
      const isSelected = assessment.getAnswer(question.id)?.value === value;
      const button = document.createElement("button");
      button.className = getAnswerButtonClass(isSelected);
      button.dataset.questionId = String(question.id);
      button.dataset.value = String(value);
      button.setAttribute("aria-label", label || String(value));

      const answerImage = ANSWER_IMAGES[value];

      if (answerImage) {
        const image = document.createElement("img");
        image.className = "answer-image";
        image.src = answerImage.src;
        image.alt = answerImage.alt;
        button.appendChild(image);
      }

      const valueText = document.createElement("span");
      valueText.className = "answer-value";
      valueText.textContent = value;
      button.appendChild(valueText);

      options.appendChild(
        createAccessButton(button, () => {
          onAnswer(value);
        }),
      );
    });

    answerSection.appendChild(options);
    container.appendChild(answerSection);
    return container;
  }

  /** Render assessment navigation controls. */
  createAssessmentNavigation({
    assessment,
    onGoHome,
    onMoveQuestion,
    onShowResult,
  }) {
    const navigation = document.createElement("div");
    navigation.className = "assessment-navigation";

    const isFirstQuestion = assessment.questionIndex === 0;
    const isLastQuestion =
      assessment.questionIndex === assessment.questions.length - 1;

    const homeButton = document.createElement("button");
    homeButton.className = "nav-button nav-button--icon";
    homeButton.appendChild(createHomeIcon());
    homeButton.setAttribute("aria-label", "Home");

    const homeAccessButton = createAccessButton(homeButton, onGoHome);
    homeAccessButton.setAttribute("access-group", "navigation");
    homeAccessButton.setAttribute("access-order", "1");
    navigation.appendChild(homeAccessButton);

    if (!isFirstQuestion) {
      const previousButton = document.createElement("button");
      previousButton.className = "nav-button";
      previousButton.textContent = "<";
      previousButton.setAttribute("aria-label", "Previous");

      const previousAccessButton = createAccessButton(previousButton, () => {
        onMoveQuestion(-1);
      });
      previousAccessButton.setAttribute("access-group", "navigation");
      previousAccessButton.setAttribute("access-order", "2");
      navigation.appendChild(previousAccessButton);
    }

    if (!isLastQuestion) {
      const nextButton = document.createElement("button");
      nextButton.className = "nav-button";
      nextButton.textContent = ">";
      nextButton.setAttribute("aria-label", "Next");

      const nextAccessButton = createAccessButton(nextButton, () => {
        onMoveQuestion(1);
      });
      nextAccessButton.setAttribute("access-group", "navigation");
      nextAccessButton.setAttribute("access-order", "3");
      navigation.appendChild(nextAccessButton);
    }

    if (isLastQuestion) {
      const resultButton = document.createElement("button");
      resultButton.className = "result-button";
      resultButton.textContent = "Result";

      const resultAccessButton = createAccessButton(resultButton, onShowResult);
      resultAccessButton.setAttribute("access-group", "navigation");
      resultAccessButton.setAttribute("access-order", "4");
      navigation.appendChild(resultAccessButton);
    }

    return navigation;
  }

  /** Render the raw answer payload. */
  renderResult({ answersPayload, assessment }) {
    const container = document.createElement("main");
    container.className = "screen screen--result";

    const title = document.createElement("h1");
    title.className = "screen-title result-title";
    title.textContent = "Assessment answers";
    container.appendChild(title);

    const payload = document.createElement("pre");
    payload.className = "result-payload";
    payload.textContent = JSON.stringify(
      answersPayload ?? assessment?.toAnswerPayload() ?? {},
      null,
      2,
    );
    container.appendChild(payload);

    return container;
  }

  /** Render a simple status message. */
  renderMessage(message) {
    const container = document.createElement("main");
    container.className = "screen screen--message";
    container.textContent = message;
    return container;
  }

  /** Update answer button styling without replacing the screen. */
  updateAnswerSelection(root, questionId, selectedValue) {
    root
      .querySelectorAll(`[data-question-id="${questionId}"]`)
      .forEach((button) => {
        button.className = getAnswerButtonClass(
          Number(button.dataset.value) === selectedValue,
        );
      });
  }
}

/** Return the scale options for a question. */
function getQuestionOptions(question) {
  if (!question.scale) {
    return [];
  }

  const options = [];

  for (
    let value = question.scale.min;
    value <= question.scale.max;
    value += question.scale.step
  ) {
    options.push({
      value,
      label: question.scale.labels?.[value] ?? "",
    });
  }

  return options;
}

/** Create the inline SVG used by the Home button. */
function createHomeIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const roof = document.createElementNS("http://www.w3.org/2000/svg", "path");
  roof.setAttribute("d", "M3 10.5 12 3l9 7.5");
  svg.appendChild(roof);

  const house = document.createElementNS("http://www.w3.org/2000/svg", "path");
  house.setAttribute("d", "M5 10v10h5v-6h4v6h5V10");
  svg.appendChild(house);

  return svg;
}
