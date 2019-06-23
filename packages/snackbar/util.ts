export function announce(ariaEl: Element, liveDelayMS: number, liveLabelTextAttribute: string,
  labelEl: Element = ariaEl) {
  const priority = ariaEl.getAttribute('aria-live');

  // Trim text to ignore `&nbsp;` (see below).
  // textContent is only null if the node is a document, DOCTYPE, or notation.
  const labelText = labelEl.textContent!.trim();
  if (!labelText || !priority) {
    return;
  }

  // Temporarily disable `aria-live` to prevent JAWS+Firefox from announcing the message twice.
  ariaEl.setAttribute('aria-live', 'off');

  // Temporarily clear `textContent` to force a DOM mutation event that will be detected by screen readers.
  // `aria-live` elements are only announced when the element's `textContent` *changes*, so snackbars
  // sent to the browser in the initial HTML response won't be read unless we clear the element's `textContent` first.
  // Similarly, displaying the same snackbar message twice in a row doesn't trigger a DOM mutation event,
  // so screen readers won't announce the second message unless we first clear `textContent`.
  //
  // We have to clear the label text two different ways to make it work in all browsers and screen readers:
  //
  //   1. `textContent = ''` is required for IE11 + JAWS
  //   2. `innerHTML = '&nbsp;'` is required for Chrome + JAWS and NVDA
  //
  // All other browser/screen reader combinations support both methods.
  //
  // The wrapper `<span>` visually hides the space character so that it doesn't cause jank when added/removed.
  // N.B.: Setting `position: absolute`, `opacity: 0`, or `height: 0` prevents Chrome from detecting the DOM change.
  //
  // This technique has been tested in:
  //
  //   * JAWS 2019:
  //       - Chrome 70
  //       - Firefox 60 (ESR)
  //       - IE 11
  //   * NVDA 2018:
  //       - Chrome 70
  //       - Firefox 60 (ESR)
  //       - IE 11
  //   * ChromeVox 53
  labelEl.textContent = '';
  labelEl.innerHTML = '<span style="display: inline-block; width: 0; height: 1px;">&nbsp;</span>';

  // Prevent visual jank by temporarily displaying the label text in the ::before pseudo-element.
  // CSS generated content is normally announced by screen readers
  // (except in IE 11; see https://tink.uk/accessibility-support-for-css-generated-content/);
  // however, `aria-live` is turned off, so this DOM update will be ignored by screen readers.
  labelEl.setAttribute(liveLabelTextAttribute, labelText);

  setTimeout(() => {
    // Allow screen readers to announce changes to the DOM again.
    ariaEl.setAttribute('aria-live', priority);

    // Remove the message from the ::before pseudo-element.
    labelEl.removeAttribute(liveLabelTextAttribute);

    // Restore the original label text, which will be announced by screen readers.
    labelEl.textContent = labelText;
  }, liveDelayMS);
}
