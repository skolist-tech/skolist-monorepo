import { Outlet } from "react-router-dom";

/** Full-bleed exam chrome — no app header/nav during an attempt. */
export function ExamLayout() {
  return (
    <div className="min-h-screen bg-[#dfe7f1]">
      <Outlet />
    </div>
  );
}
