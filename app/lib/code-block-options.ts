import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { keymap } from "@codemirror/view";
import { classHighlighter } from "@lezer/highlight";
import type { CodeBlockConfig } from "@milkdown/kit/component/code-block";

function icon(paths: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

export const codeBlockOptions: Partial<CodeBlockConfig> = {
  extensions: [
    keymap.of([...defaultKeymap, indentWithTab]),
    syntaxHighlighting(classHighlighter),
  ],
  languages,
  expandIcon: icon('<path d="m6 9 6 6 6-6"/>'),
  searchIcon: icon('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  clearSearchIcon: icon('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  copyIcon: icon(
    '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  ),
  // label is rendered in CSS so it can switch to "Copied"
  copyText: "",
  searchPlaceholder: "Search language",
  noResultText: "No languages found",
};
