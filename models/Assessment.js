import { Answer } from "./Answer.js";
import { Question } from "./Question.js";

/** Manage questions, current position, and answer state. */
export class Assessment {
  /** Create an assessment with question models and answer state. */
  constructor({
    id = null,
    title = "",
    description = "",
    version = "",
    questions = [],
    questionIndex = 0,
    answers = [],
  } = {}) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.version = version;

    this.questions = questions.map((q) =>
      q instanceof Question ? q : new Question(q),
    );

    this.questionIndex = questionIndex;
    this.answers = new Map(
      answers.map((answer) => {
        const answerObj = answer instanceof Answer ? answer : new Answer(answer);
        return [answerObj.questionId, answerObj];
      }),
    );
  }

  /** Return the question at the current index, or null when unavailable. */
  currentQuestion() {
    return this.questions[this.questionIndex] ?? null;
  }

  /** Move the current question index within the assessment bounds. */
  moveQuestion(step) {
    this.questionIndex = Math.max(
      0,
      Math.min(this.questions.length - 1, this.questionIndex + step),
    );
  }

  /** Record an answer for a specific question. */
  answerQuestion(questionId, value) {
    if (!this.questions.some((question) => question.id === questionId)) {
      throw new Error(`Question not found: ${questionId}`);
    }

    const answer = new Answer({
      assessmentId: this.id,
      questionId,
      value,
    });

    this.answers.set(questionId, answer);
    return answer;
  }

  /** Record an answer for the current question. */
  answerCurrentQuestion(value) {
    const question = this.currentQuestion();

    if (!question) {
      throw new Error("No current question to answer");
    }

    return this.answerQuestion(question.id, value);
  }

  /** Return the answer for a question, or null when unanswered. */
  getAnswer(questionId) {
    return this.answers.get(questionId) ?? null;
  }

  /** Convert answer state into the payload saved remotely. */
  toAnswerPayload() {
    return {
      assessmentId: this.id,
      assessmentVersion: this.version,
      questionIndex: this.questionIndex,
      updatedAt: new Date().toISOString(),
      answers: Array.from(this.answers.values(), (answer) => answer.toPayload()),
    };
  }

  /** Check whether a question has a non-null answer. */
  isQuestionAnswered(questionId) {
    return (
      this.answers.has(questionId) && this.answers.get(questionId).isAnswered()
    );
  }

  /** Check whether the final question is reached and all questions are answered. */
  isComplete() {
    return (
      this.questionIndex === this.questions.length - 1 &&
      this.questions.every((question) => this.isQuestionAnswered(question.id))
    );
  }
}
