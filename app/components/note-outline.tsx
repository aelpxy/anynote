import { useEffect, useState } from "react";

import { scrollToHeading } from "~/lib/heading-anchor-plugin";

type OutlineHeading = {
  id: string;
  text: string;
  level: number;
};

type NoteOutlineProps = {
  editorRef: React.RefObject<HTMLDivElement | null>;
};

// headings closer than this to the top of the page count as the one being read
const activeOffsetPx = 96;

function readHeadingText(heading: HTMLElement) {
  const copy = heading.cloneNode(true) as HTMLElement;
  copy.querySelectorAll(".heading-anchor").forEach((anchor) => anchor.remove());
  return copy.textContent?.trim() ?? "";
}

function readHeadings(root: HTMLElement): OutlineHeading[] {
  return [...root.querySelectorAll<HTMLElement>(".ProseMirror :is(h1, h2, h3, h4, h5, h6)")]
    .map((heading) => ({
      id: heading.id,
      text: readHeadingText(heading),
      level: Number(heading.tagName[1]),
    }))
    .filter((heading) => heading.id && heading.text);
}

export function NoteOutline({ editorRef }: NoteOutlineProps) {
  const [headings, setHeadings] = useState<OutlineHeading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setHeadings(readHeadings(root)));
    };
    const observer = new MutationObserver(update);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    update();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [editorRef]);

  useEffect(() => {
    const scroller = editorRef.current?.closest("main");
    if (!scroller || headings.length === 0) return;
    const update = () => {
      let current: string | null = null;
      for (const { id } of headings) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= activeOffsetPx) current = id;
      }
      setActiveId(current ?? headings[0].id);
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    return () => scroller.removeEventListener("scroll", update);
  }, [editorRef, headings]);

  if (headings.length < 2) return null;
  const minLevel = Math.min(...headings.map(({ level }) => level));

  return (
    <nav
      aria-label="Outline"
      className="fixed top-24 right-6 hidden max-h-[calc(100dvh-8rem)] w-52 overflow-y-auto 2xl:block print:hidden"
    >
      <ul className="flex flex-col gap-0.5 border-l border-neutral-200 dark:border-neutral-800">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              type="button"
              onClick={() => scrollToHeading(heading.id)}
              style={{ paddingLeft: `${(heading.level - minLevel) * 0.75 + 0.75}rem` }}
              className={[
                "-ml-px block w-full truncate border-l py-0.5 pr-2 text-left text-xs transition-colors",
                heading.id === activeId
                  ? "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100"
                  : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
              ].join(" ")}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
