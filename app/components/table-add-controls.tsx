import { autoUpdate, offset, size, useFloating } from "@floating-ui/react-dom";
import type { Node } from "@milkdown/kit/prose/model";
import { Selection, TextSelection } from "@milkdown/kit/prose/state";
import { addColumnAfter } from "@milkdown/kit/prose/tables";
import type { EditorView } from "@milkdown/kit/prose/view";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const hideDelayMs = 300;
const controlsReachPx = 32;

type TableAddControlsProps = {
  view: EditorView;
};

type HoveredTable = {
  area: HTMLElement;
  table: HTMLTableElement;
};

const barClassName =
  "z-20 flex items-center justify-center rounded-md bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100";

function findHoveredTable(target: EventTarget | null): HoveredTable | null {
  if (!(target instanceof Element)) return null;
  const area = target.closest<HTMLElement>(".tableWrapper");
  const table = area?.querySelector("table") ?? target.closest("table");
  return table ? { area: area ?? table, table } : null;
}

function findTableNode(view: EditorView, table: HTMLTableElement) {
  const firstCell = table.querySelector("th, td");
  if (!firstCell) return null;
  const $pos = view.state.doc.resolve(view.posAtDOM(firstCell, 0));
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.type.name === "table") return { pos: $pos.before(depth), node };
  }
  return null;
}

export function TableAddControls({ view }: TableAddControlsProps) {
  const [hovered, setHovered] = useState<HoveredTable | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const rowBar = useFloating({
    strategy: "fixed",
    placement: "bottom-start",
    elements: { reference: hovered?.area },
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      size({
        apply({ rects, elements }) {
          elements.floating.style.width = `${rects.reference.width}px`;
        },
      }),
    ],
  });

  const columnBar = useFloating({
    strategy: "fixed",
    placement: "right-start",
    elements: { reference: hovered?.area },
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      size({
        apply({ rects, elements }) {
          elements.floating.style.height = `${rects.reference.height}px`;
        },
      }),
    ],
  });

  function keepVisible() {
    clearTimeout(hideTimeoutRef.current);
  }

  function scheduleHide() {
    clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setHovered(null), hideDelayMs);
  }

  const hoveredRef = useRef<HoveredTable | null>(null);

  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    const root = view.dom;

    function isWithinReach(current: HoveredTable, event: PointerEvent) {
      if (!current.area.isConnected) return false;
      const rect = current.area.getBoundingClientRect();
      return (
        event.clientX >= rect.left &&
        event.clientX <= rect.right + controlsReachPx &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom + controlsReachPx
      );
    }

    function handlePointerMove(event: PointerEvent) {
      const next = findHoveredTable(event.target);
      if (next && root.contains(next.table)) {
        keepVisible();
        setHovered((current) => (current?.table === next.table ? current : next));
        return;
      }
      const current = hoveredRef.current;
      if (current && isWithinReach(current, event)) keepVisible();
      else if (current) scheduleHide();
    }

    document.addEventListener("pointermove", handlePointerMove);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      clearTimeout(hideTimeoutRef.current);
    };
  }, [view]);

  function addRow() {
    if (!hovered) return;
    const found = findTableNode(view, hovered.table);
    const header = found?.node.firstChild;
    const { table_row: rowType, table_cell: cellType } = view.state.schema.nodes;
    if (!found || !header || !rowType || !cellType) return;

    const cells: Node[] = [];
    header.forEach((headerCell) => {
      const cell = cellType.createAndFill({ alignment: headerCell.attrs.alignment });
      if (cell) cells.push(cell);
    });
    const insertPos = found.pos + found.node.nodeSize - 1;
    const tr = view.state.tr.insert(insertPos, rowType.create(null, cells));
    tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos + 1)));
    view.dispatch(tr.scrollIntoView());
    view.focus();
  }

  function addColumn() {
    if (!hovered) return;
    const found = findTableNode(view, hovered.table);
    if (!found) return;
    const end = view.state.doc.resolve(found.pos + found.node.nodeSize - 1);
    view.dispatch(view.state.tr.setSelection(Selection.near(end, -1)));
    addColumnAfter(view.state, view.dispatch);
    view.focus();
    const { area } = hovered;
    requestAnimationFrame(() => area.scrollTo({ left: area.scrollWidth }));
  }

  if (!hovered) return null;

  return createPortal(
    <>
      <button
        ref={rowBar.refs.setFloating}
        style={rowBar.floatingStyles}
        type="button"
        aria-label="Add row"
        title="Add row"
        onMouseDown={(event) => event.preventDefault()}
        onClick={addRow}
        className={`h-5 ${barClassName}`}
      >
        <Plus className="size-3.5" />
      </button>
      <button
        ref={columnBar.refs.setFloating}
        style={columnBar.floatingStyles}
        type="button"
        aria-label="Add column"
        title="Add column"
        onMouseDown={(event) => event.preventDefault()}
        onClick={addColumn}
        className={`w-5 ${barClassName}`}
      >
        <Plus className="size-3.5" />
      </button>
    </>,
    document.body,
  );
}
