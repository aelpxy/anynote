export function handleRadioGroupKeyDown<Value>(
  event: React.KeyboardEvent<HTMLElement>,
  values: readonly Value[],
  current: Value,
  onChange: (value: Value) => void,
) {
  const offset = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
  if (offset === undefined) return;
  event.preventDefault();

  const index = (values.indexOf(current) + offset + values.length) % values.length;
  onChange(values[index]);
  event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[index]?.focus();
}
