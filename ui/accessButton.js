/** Wrap a control in Squidly's access-button element. */
export function createAccessButton(child, onActivate) {
  const accessButton = document.createElement("access-button");

  accessButton.addEventListener("access-click", onActivate);
  accessButton.appendChild(child);

  return accessButton;
}
