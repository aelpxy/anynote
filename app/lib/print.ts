// dark-theme text would print light-on-white, so print in the light theme
export function printDocument(title?: string) {
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  const previousTitle = document.title;

  root.classList.remove("dark");
  // browsers use the page title as the default pdf file name
  if (title) document.title = title;
  window.addEventListener(
    "afterprint",
    () => {
      root.classList.toggle("dark", wasDark);
      document.title = previousTitle;
    },
    { once: true },
  );
  window.print();
}
