import { Answer } from "./models/Answer.js";
import { AssessmentRepository } from "./services/AssessmentRepository.js";
import { AssessmentViews } from "./ui/AssessmentViews.js";

const DEFAULT_SOURCE = "default_bank";
const STATE_MENU = "menu";
const STATE_ASSESSMENT = "assessment";
const STATE_RESULT = "result";

/** Coordinate assessment state, persistence, and screen rendering. */
class PainManagementApp {
  /** Create the app coordinator for one assessment source. */
  constructor({ source = DEFAULT_SOURCE } = {}) {
    this.source = source;
    this.assessmentRepo = new AssessmentRepository();
    this.views = new AssessmentViews();

    this.state = STATE_MENU;
    this.assessmentId = null;
    this.assessmentIndex = [];
    this.assessment = null;
    this.answersPayload = null;
    this.renderQueued = false;

    this.root = null;

    this.init();
  }

  /** Create UI, load assessment metadata, and start Firebase sync. */
  async init() {
    this.createUI();
    this.addListeners();

    this.assessmentIndex = await this.assessmentRepo.fetchAssessmentIndex(
      this.source,
    );

    this.initDefaultFirebaseValues();
    this.requestRender();
  }

  /** Create the single render root. Screens replace this root's children. */
  createUI() {
    this.root = document.createElement("div");
    this.root.className = "app-root";
    document.body.appendChild(this.root);
  }

  /** Seed remote state for a fresh session. */
  initDefaultFirebaseValues() {
    this.setFirebaseValue("state", STATE_MENU);
  }

  /** Keep local app state in sync with Squidly/Firebase values. */
  addListeners() {
    SquidlyAPI.firebaseOnValue("state", async (value) => {
      if (!value) return;

      this.state = value;

      if (this.state === STATE_ASSESSMENT && this.assessmentId) {
        await this.loadAssessment(this.assessmentId);
      }

      this.requestRender();
    });

    SquidlyAPI.firebaseOnValue("assessmentId", async (value) => {
      if (!value) return;

      this.assessmentId = value;

      if (this.state === STATE_ASSESSMENT) {
        await this.loadAssessment(value);
      }

      this.requestRender();
    });

    SquidlyAPI.firebaseOnValue("assessmentAnswers", (value) => {
      if (!value) return;

      this.answersPayload = JSON.parse(value);
      this.applyAnswerPayload();

      this.requestRender();
    });
  }

  /** Load the selected assessment and apply any existing answer payload. */
  async loadAssessment(assessmentId) {
    this.assessment = await this.assessmentRepo.fetchAssessment(
      assessmentId,
      this.source,
    );
    this.applyAnswerPayload();
  }

  /** Apply Firebase progress to the local assessment model. */
  applyAnswerPayload() {
    if (!this.assessment || !this.answersPayload) {
      return;
    }

    if (this.answersPayload.assessmentId !== this.assessment.id) {
      return;
    }

    this.assessment.questionIndex = this.answersPayload.questionIndex ?? 0;
    this.assessment.answers = new Map(
      (this.answersPayload.answers ?? []).map((answer) => {
        const answerObj = new Answer({
          assessmentId: this.assessment.id,
          questionId: answer.questionId,
          value: answer.value,
          answeredAt: answer.answeredAt,
        });

        return [answerObj.questionId, answerObj];
      }),
    );
  }

  /** Render the current screen from app state. */
  render() {
    if (!this.root) return;

    this.root.replaceChildren(this.createCurrentScreen());
  }

  /** Coalesce state-change renders and keep DOM replacement outside access-click handlers. */
  requestRender() {
    if (this.renderQueued) {
      return;
    }

    this.renderQueued = true;

    window.setTimeout(() => {
      this.renderQueued = false;
      this.render();
    }, 0);
  }

  /** Build the current screen element from app state. */
  createCurrentScreen() {
    if (this.state === STATE_MENU) {
      return this.views.renderMenu({
        assessmentIndex: this.assessmentIndex,
        onSelectAssessment: (assessmentId) => {
          this.selectAssessment(assessmentId);
        },
      });
    }

    if (this.state === STATE_ASSESSMENT) {
      if (!this.assessment) {
        return this.views.renderMessage("Loading assessment...");
      }

      return this.views.renderAssessment({
        assessment: this.assessment,
        onAnswer: (value) => {
          this.answerCurrentQuestion(value);
        },
        onGoHome: () => {
          this.returnToMenu();
        },
        onMoveQuestion: (step) => {
          this.moveQuestion(step);
        },
        onShowResult: () => {
          this.showResult();
        },
      });
    }

    if (this.state === STATE_RESULT) {
      return this.views.renderResult({
        answersPayload: this.answersPayload,
        assessment: this.assessment,
      });
    }

    return this.views.renderMessage("Unknown app state.");
  }

  /** Select an assessment and enter the assessment screen. */
  selectAssessment(assessmentId) {
    this.assessmentId = assessmentId;
    this.assessment = null;
    this.answersPayload = null;

    this.setFirebaseValue("assessmentId", assessmentId);
    this.setFirebaseValue("assessmentAnswers", "");
    this.setFirebaseValue("state", STATE_ASSESSMENT);
  }

  /** Save an answer for the current question and publish the updated payload. */
  answerCurrentQuestion(value) {
    if (!this.assessment) {
      return;
    }

    this.assessment.answerCurrentQuestion(value);
    this.syncAnswersToFirebase();
    this.views.updateAnswerSelection(
      this.root,
      this.assessment.currentQuestion().id,
      value,
    );
  }

  /** Move the current question and publish the updated payload. */
  moveQuestion(step) {
    if (this.state !== STATE_ASSESSMENT || !this.assessment) {
      return;
    }

    this.assessment.moveQuestion(step);
    this.syncAnswersToFirebase();
    this.requestRender();
  }

  /** Show the result screen after Squidly activates the result control. */
  showResult() {
    this.state = STATE_RESULT;
    this.setFirebaseValue("state", STATE_RESULT);
    this.requestRender();
  }

  /** Return to menu and remove any progress for the active assessment. */
  returnToMenu() {
    this.state = STATE_MENU;
    this.assessmentId = null;
    this.assessment = null;
    this.answersPayload = null;

    this.setFirebaseValue("assessmentId", "");
    this.setFirebaseValue("assessmentAnswers", "");
    this.setFirebaseValue("state", STATE_MENU);
    this.requestRender();
  }

  /** Persist the assessment answer payload to Firebase. */
  syncAnswersToFirebase() {
    if (!this.assessment) {
      return;
    }

    const payload = this.assessment.toAnswerPayload();
    this.answersPayload = payload;
    this.setFirebaseValue("assessmentAnswers", JSON.stringify(payload));
  }

  /** Write one value through Squidly/Firebase. */
  setFirebaseValue(key, value) {
    SquidlyAPI.firebaseSet(key, value);
  }
}

new PainManagementApp({ source: DEFAULT_SOURCE });
