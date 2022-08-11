import { ReactNode } from "react";

export default function StatusHistoryBox({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="m-1 p-3 border border-gray rounded">{children}</div>;
}
