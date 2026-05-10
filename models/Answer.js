/** Store one answer for one assessment question. */
export class Answer {
  /** Create a single answer record for an assessment question. */
  constructor({
    assessmentId = null,
    questionId = null,
    value = null,
    answeredAt = new Date().toISOString(),
  } = {}) {
    this.assessmentId = assessmentId;
    this.questionId = questionId;
    this.value = value;
    this.answeredAt = answeredAt;
  }

  /** Check whether this answer has a value. */
  isAnswered() {
    return this.value !== null;
  }

  /** Convert the answer into the remote payload shape. */
  toPayload() {
    return {
      questionId: this.questionId,
      value: this.value,
      answeredAt: this.answeredAt,
    };
  }
}
