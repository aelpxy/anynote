type DialogFooterProps = {
  children: React.ReactNode;
};

export function DialogFooter({ children }: DialogFooterProps) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
      {children}
    </div>
  );
}
