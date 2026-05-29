/**
 * Streaming XML tag parser for AI responses.
 *
 * State machine (per spec §7):
 *   NORMAL      — outside any registered tag; chars emit as `raw`.
 *   BUFFER_TAG  — saw `<`; accumulating tag name until `>` (or overflow).
 *   TAGGED      — inside a transparent tag; chars emit as `tag-chunk`,
 *                 nested `<` re-enters BUFFER_TAG so closing tag can be detected.
 *   OPAQUE      — inside `thinking`/`think`-style tag; chars emit as `tag-chunk`
 *                 but inner `<...>` is NOT parsed; we only watch for `</tagname>`.
 */

export type ParserEvent =
  | { type: 'tag-open'; tag: string; attrs?: Record<string, string> }
  | { type: 'tag-chunk'; tag: string; chunk: string }
  | { type: 'tag-close'; tag: string; full: string; attrs?: Record<string, string> }
  | { type: 'option-line'; line: string }
  | { type: 'chat-entry'; chatType: string; content: string; duration?: number; amount?: number; transferNote?: string; fileName?: string; fileSize?: string; address?: string; lat?: number; lng?: number; time?: string }
  | { type: 'raw'; chunk: string };

type State = 'NORMAL' | 'BUFFER_TAG' | 'TAGGED' | 'OPAQUE';

const PARTIAL_LIMIT = 64;

export class StreamTagParser {
  private state: State = 'NORMAL';
  private partial = '';
  private currentTag = '';
  private currentBuf = '';
  private optionBuf = '';
  private currentAttrs: Record<string, string> = {};
  private events: ParserEvent[] = [];

  constructor(
    private readonly tags: string[],
    private readonly opaqueTags: string[],
  ) {}

  feed(chunk: string): ParserEvent[] {
    this.events = [];
    for (const ch of chunk) this.consumeChar(ch);
    return this.events;
  }

  finish(): ParserEvent[] {
    this.events = [];
    if (this.state === 'BUFFER_TAG' && this.partial) {
      this.events.push({ type: 'raw', chunk: '<' + this.partial });
      this.partial = '';
    }
    if (this.state === 'TAGGED' || this.state === 'OPAQUE') {
      if (this.state === 'TAGGED' && this.currentTag === 'option' && this.optionBuf) {
        this.events.push({ type: 'option-line', line: this.optionBuf });
        this.optionBuf = '';
      }
      this.events.push({ type: 'tag-close', tag: this.currentTag, full: this.currentBuf });
      this.currentBuf = '';
      this.currentTag = '';
    }
    this.state = 'NORMAL';
    return this.events;
  }

  private consumeChar(ch: string) {
    if (this.state === 'NORMAL') {
      if (ch === '<') {
        this.state = 'BUFFER_TAG';
        this.partial = '';
      } else {
        this.events.push({ type: 'raw', chunk: ch });
      }
      return;
    }
    if (this.state === 'BUFFER_TAG') {
      if (ch === '>') {
        this.flushTagBuffer();
        return;
      }
      if (this.partial.length >= PARTIAL_LIMIT) {
        // Overflow: this is not a tag, dump partial back as raw.
        this.events.push({ type: 'raw', chunk: '<' + this.partial + ch });
        this.partial = '';
        this.state = 'NORMAL';
        return;
      }
      this.partial += ch;
      return;
    }
    if (this.state === 'OPAQUE') {
      this.currentBuf += ch;
      const closeMarker = `</${this.currentTag}>`;
      if (this.currentBuf.endsWith(closeMarker)) {
        const full = this.currentBuf.slice(0, -closeMarker.length);
        this.events.push({ type: 'tag-chunk', tag: this.currentTag, chunk: ch });
        this.events.push({ type: 'tag-close', tag: this.currentTag, full });
        this.state = 'NORMAL';
        this.currentBuf = '';
        this.currentTag = '';
      } else {
        this.events.push({ type: 'tag-chunk', tag: this.currentTag, chunk: ch });
      }
      return;
    }
    if (this.state === 'TAGGED') {
      if (ch === '<') {
        this.state = 'BUFFER_TAG';
        this.partial = '';
        return;
      }
      if (this.currentTag === 'option' && ch === '\n') {
        this.events.push({ type: 'option-line', line: this.optionBuf });
        this.optionBuf = '';
      } else if (this.currentTag === 'option') {
        this.optionBuf += ch;
      }
      this.currentBuf += ch;
      this.events.push({ type: 'tag-chunk', tag: this.currentTag, chunk: ch });
      return;
    }
  }

  private flushTagBuffer() {
    const tagText = this.partial;
    this.partial = '';
    const isClose = tagText.startsWith('/');
    const cleanTag = isClose ? tagText.slice(1) : tagText;

    // Parse tag name and attributes (e.g., 'chat type="text" duration="5"')
    const spaceIdx = cleanTag.indexOf(' ');
    const name = spaceIdx > 0 ? cleanTag.slice(0, spaceIdx) : cleanTag;
    const attrStr = spaceIdx > 0 ? cleanTag.slice(spaceIdx + 1) : '';
    const attrs = parseAttrs(attrStr);

    if (isClose) {
      if (this.currentTag && this.currentTag === name) {
        if (this.currentTag === 'option' && this.optionBuf) {
          this.events.push({ type: 'option-line', line: this.optionBuf });
          this.optionBuf = '';
        }
        if (this.currentTag === 'chat') {
          this.events.push({
            type: 'chat-entry',
            chatType: this.currentAttrs['type'] || 'text',
            content: this.currentBuf,
            duration: this.currentAttrs['duration'] ? Number(this.currentAttrs['duration']) : undefined,
            amount: this.currentAttrs['amount'] ? Number(this.currentAttrs['amount']) : undefined,
            transferNote: this.currentAttrs['note'] || undefined,
            fileName: this.currentAttrs['filename'] || undefined,
            fileSize: this.currentAttrs['filesize'] || undefined,
            address: this.currentAttrs['address'] || undefined,
            lat: this.currentAttrs['lat'] ? Number(this.currentAttrs['lat']) : undefined,
            lng: this.currentAttrs['lng'] ? Number(this.currentAttrs['lng']) : undefined,
            time: this.currentAttrs['time'] || undefined,
          });
        }
        this.events.push({ type: 'tag-close', tag: this.currentTag, full: this.currentBuf, attrs: this.currentAttrs });
        this.currentBuf = '';
        this.currentTag = '';
        this.currentAttrs = {};
        this.state = 'NORMAL';
      } else {
        this.events.push({ type: 'raw', chunk: `</${name}>` });
        this.state = 'NORMAL';
      }
      return;
    }

    if (!this.tags.includes(name)) {
      this.events.push({ type: 'raw', chunk: `<${tagText}>` });
      this.state = 'NORMAL';
      return;
    }

    this.currentTag = name;
    this.currentAttrs = attrs;
    this.currentBuf = '';
    this.optionBuf = '';
    this.events.push({ type: 'tag-open', tag: name, attrs });
    this.state = this.opaqueTags.includes(name) ? 'OPAQUE' : 'TAGGED';
  }

  /** Expose events for external aggregation after finish() */
  get collectedEvents(): ParserEvent[] {
    return this.events;
  }
}

/** Parse HTML-like attributes from a string like 'type="text" duration="5"' */
function parseAttrs(str: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!str.trim()) return attrs;
  const regex = /(\w+)=["']([^"']*)["']/g;
  let m;
  while ((m = regex.exec(str)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}
