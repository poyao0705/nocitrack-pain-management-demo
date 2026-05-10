/** Return the answer button class for selected or normal state. */
export function getAnswerButtonClass(isSelected) {
  return isSelected ? "answer-button answer-button--selected" : "answer-button";
}
