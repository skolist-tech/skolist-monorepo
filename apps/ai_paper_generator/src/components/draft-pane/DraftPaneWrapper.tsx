import { DraftProvider } from "../../context/DraftContext";
import { DraftPane } from "./DraftPane";

export function DraftPaneWrapper() {
  return (
    <DraftProvider>
      <DraftPane />
    </DraftProvider>
  );
}
