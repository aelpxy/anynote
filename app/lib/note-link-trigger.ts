import type { EditorState } from "@milkdown/kit/prose/state";

export type NoteLinkTrigger = {
  from: number;
  to: number;
  query: string;
};

const triggerPattern = /\[\[([^[\]\n￼]{0,60})$/;

export function findNoteLinkTrigger(state: EditorState): NoteLinkTrigger | null {
  const { selection, schema } = state;
  if (!selection.empty) return null;

  const { $from } = selection;
  if (!$from.parent.isTextblock || $from.parent.type.spec.code) return null;
  if (schema.marks.inlineCode.isInSet($from.marks())) return null;

  const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, "￼");
  const match = triggerPattern.exec(textBefore);
  if (!match) return null;
  return { from: $from.pos - match[0].length, to: $from.pos, query: match[1] };
}
