/**
 * Converts an HTML string into plain text for the browser, replacing:
 * - <span data-type="mention" data-id="...">...</span> with a value returned by `resolveMention`
 * - <br> with a newline character ("\n")
 * - Any other HTML with its text content (HTML entities are decoded by the DOM parser)
 */
export type ResolveMentionFn = (id: string, el: HTMLElement) => string | null | undefined;

/**
 * Parse rich HTML text and return plain text with mentions resolved and <br> as newlines.
 * Works in the browser using the DOM to safely parse and decode entities.
 */
export function parseRichTextToPlain(html: string, resolveMention: ResolveMentionFn): string {
  const container = document.createElement('div');
  container.innerHTML = html;

  const out: string[] = [];

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      out.push(node.nodeValue || '');
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName;

      if (tag === 'BR') {
        out.push('\n');
        return;
      }

      if (tag === 'SPAN' && el.getAttribute('data-type') === 'mention') {
        const id = el.getAttribute('data-id') || '';
        const replacement = resolveMention(id, el);
        out.push((replacement && `"Идентификатор поля: id; значение: ${replacement}"`) ?? el.textContent ?? '');
        return; // We have handled the mention; do not traverse its children
      }

      // Default: traverse children and collect text
      for (const child of Array.from(el.childNodes)) {
        walk(child);
      }
    }
  };

  for (const child of Array.from(container.childNodes)) {
    walk(child);
  }

  return out.join('');
}
