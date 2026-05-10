/** Store question-bank data for one question. */
export class Question {
  /** Create a question from question-bank data. */
  constructor({
    id = null,
    question = null,
    imageUrl = null,
    base64 = null,
    responseType = "likert",
    scale = null,
  } = {}) {
    this.id = id;
    this.question = question;
    this.imageUrl = imageUrl;
    this.base64 = base64;
    this.responseType = responseType;
    this.scale = scale;
  }
}
