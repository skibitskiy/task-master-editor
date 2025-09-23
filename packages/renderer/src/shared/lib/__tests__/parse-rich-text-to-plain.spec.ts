import { describe, expect, it } from 'vitest';

import { parseRichTextToPlain } from '../parse-rich-text-to-plain';

describe('parseRichTextToPlain', () => {
  it('replaces mentions and <br> with newlines, decodes entities', () => {
    const html = `<p>Вот текущие детали выполнения задачи <span class="_mention_1hcds_38" data-type="mention" data-id="Детали" data-mention-suggestion-char="@">@Детали</span> <br><br>Опиши его подробнее с учетом описания <span class="_mention_1hcds_38" data-type="mention" data-id="Описание" data-mention-suggestion-char="@">@Описание</span> <br>&lt;span&gt;213&lt;/span&gt;</p>`;

    const map: Record<string, string> = {
      Детали: 'детали выполнения задачи',
      Описание: 'описание задачи',
    };

    const result = parseRichTextToPlain(html, (id) => map[id]);

    expect(result).toEqual(
      'Вот текущие детали выполнения задачи ' +
        'детали выполнения задачи ' +
        '\n\n' +
        'Опиши его подробнее с учетом описания ' +
        'описание задачи ' +
        '\n' +
        '<span>213</span>',
    );
  });

  it('falls back to element text when resolver returns undefined', () => {
    const html = '<p>Тест <span data-type="mention" data-id="X">@X</span> конец</p>';
    const result = parseRichTextToPlain(html, () => undefined);
    expect(result).toEqual('Тест @X конец');
  });

  it('traverses nested elements normally', () => {
    const html = '<p>Hello <strong>World</strong> and <em>friends</em></p>';
    const result = parseRichTextToPlain(html, () => '');
    expect(result).toEqual('Hello World and friends');
  });

  it('handles mention with child nodes by not traversing its children', () => {
    const html = '<p>Hi <span data-type="mention" data-id="User"><em>@User</em></span>!</p>';
    const result = parseRichTextToPlain(html, (id) => (id === 'User' ? 'Alice' : ''));
    expect(result).toEqual('Hi Alice!');
  });

  it('handles sequences of <br> correctly', () => {
    const html = 'line1<br><br><br>line2';
    const result = parseRichTextToPlain(html, () => '');
    expect(result).toEqual('line1\n\n\nline2');
  });
});
