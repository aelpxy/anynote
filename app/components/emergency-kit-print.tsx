import { createPortal } from "react-dom";

import { EmergencyKit } from "~/components/emergency-kit";

type EmergencyKitPrintProps = {
  username: string;
  secretKey: string;
};

// printed on its own so the pdf holds only the kit, not the page or dialog behind it
export function EmergencyKitPrint({ username, secretKey }: EmergencyKitPrintProps) {
  return createPortal(
    <div id="emergency-kit-print" className="hidden p-8 print:block">
      <EmergencyKit username={username} secretKey={secretKey} />
    </div>,
    document.body,
  );
}
