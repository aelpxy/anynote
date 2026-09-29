import { NoteFontSelector } from "~/components/note-font-selector";
import { SegmentedControl } from "~/components/segmented-control";
import { useNoteAppearance } from "~/hooks/use-note-appearance";
import { setNoteAppearance } from "~/lib/note-appearance";

export function NoteAppearanceSettings() {
  const appearance = useNoteAppearance();

  return (
    <div className="flex flex-col gap-3">
      <NoteFontSelector />
      <SegmentedControl
        label="Text size"
        value={appearance.size}
        onChange={(value) => setNoteAppearance("size", value)}
        options={[
          { value: "small", label: "Small" },
          { value: "default", label: "Default" },
          { value: "large", label: "Large" },
        ]}
      />
      <SegmentedControl
        label="Line spacing"
        value={appearance.spacing}
        onChange={(value) => setNoteAppearance("spacing", value)}
        options={[
          { value: "compact", label: "Compact" },
          { value: "default", label: "Default" },
          { value: "relaxed", label: "Relaxed" },
        ]}
      />
      <SegmentedControl
        label="Page width"
        value={appearance.width}
        onChange={(value) => setNoteAppearance("width", value)}
        options={[
          { value: "normal", label: "Normal" },
          { value: "wide", label: "Full" },
        ]}
      />
    </div>
  );
}
