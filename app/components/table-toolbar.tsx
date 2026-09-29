import {
  addRowAfterCommand,
  addRowBeforeCommand,
} from "@milkdown/kit/preset/gfm";
import type { Command, EditorState } from "@milkdown/kit/prose/state";
import {
  addColumnAfter,
  addColumnBefore,
  deleteColumn,
  deleteRow,
  deleteTable,
} from "@milkdown/kit/prose/tables";
import type { EditorView } from "@milkdown/kit/prose/view";
import { callCommand } from "@milkdown/kit/utils";
import { useInstance } from "@milkdown/react";
import {
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  TableColumnsSplit,
  TableRowsSplit,
  Trash2,
} from "lucide-react";

import { EditorToolbarButton } from "~/components/editor-toolbar-button";
import { EditorToolbarSeparator } from "~/components/editor-toolbar-separator";
import { FloatingToolbar } from "~/components/floating-toolbar";
import { findParentNode } from "~/lib/editor-selection";

type TableToolbarProps = {
  view: EditorView;
  state: EditorState;
  tablePos: number;
};

export function TableToolbar({ view, state, tablePos }: TableToolbarProps) {
  const [, getEditor] = useInstance();
  const table = view.nodeDOM(tablePos);
  // markdown tables always keep exactly one header row
  const isInHeaderRow = Boolean(findParentNode(state, "table_header_row"));
  if (!(table instanceof Element)) return null;

  function run(command: Command) {
    command(view.state, view.dispatch);
    view.focus();
  }

  // milkdown's row commands copy each column's alignment into the new row
  function addRow(commandKey: typeof addRowAfterCommand.key) {
    getEditor()?.action(callCommand(commandKey));
    view.focus();
  }

  return (
    <FloatingToolbar reference={table} label="Table" placement="top-start">
      <EditorToolbarButton
        icon={BetweenHorizontalStart}
        label="Add row above"
        disabled={isInHeaderRow}
        onClick={() => addRow(addRowBeforeCommand.key)}
      />
      <EditorToolbarButton
        icon={BetweenHorizontalEnd}
        label="Add row below"
        onClick={() => addRow(addRowAfterCommand.key)}
      />
      <EditorToolbarButton
        icon={BetweenVerticalStart}
        label="Add column left"
        onClick={() => run(addColumnBefore)}
      />
      <EditorToolbarButton
        icon={BetweenVerticalEnd}
        label="Add column right"
        onClick={() => run(addColumnAfter)}
      />
      <EditorToolbarSeparator />
      <EditorToolbarButton
        icon={TableRowsSplit}
        label="Delete row"
        disabled={isInHeaderRow}
        onClick={() => run(deleteRow)}
      />
      <EditorToolbarButton
        icon={TableColumnsSplit}
        label="Delete column"
        onClick={() => run(deleteColumn)}
      />
      <EditorToolbarButton
        icon={Trash2}
        label="Delete table"
        onClick={() => run(deleteTable)}
      />
    </FloatingToolbar>
  );
}
