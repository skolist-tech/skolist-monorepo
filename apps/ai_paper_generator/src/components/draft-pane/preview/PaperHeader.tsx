import type { QgenDraft } from "@skolist/db";
import { useDraftContext } from "../../../context/DraftContext";
import { useEffect, useState } from "react";

const formatTime = (timeStr?: string | null) => {
  if (!timeStr) return "60 mins";
  // If it's already "X mins" style, use it
  if (timeStr.toLowerCase().includes("min")) return timeStr;

  // Try parsing HH:MM:SS or HH:MM
  const parts = timeStr.split(":").map(Number);
  if (parts.length >= 2) {
    const [h, m] = parts;
    const totalMinutes = (h || 0) * 60 + (m || 0);
    return totalMinutes > 0 ? `${totalMinutes} Mins` : timeStr;
  }
  return timeStr;
};

export const PaperHeader = ({
  draft,
  titleSuffix,
}: {
  draft: QgenDraft;
  titleSuffix?: string;
}) => {
  const [logoSignedUrl, setLogoSignedUrl] = useState<string | null>(null);
  const { logoVersion } = useDraftContext();

  useEffect(() => {
    let isMounted = true;
    async function fetchLogo() {
      if (draft.logo_url && draft.logo_url.startsWith("http")) {
        // Legacy support if URL is stored
        if (isMounted) setLogoSignedUrl(draft.logo_url);
        return;
      }
      if (draft.logo_url) {
        const { getSignedLogoUrl } =
          await import("../../../services/draftService");
        const url = await getSignedLogoUrl(draft.logo_url);
        if (isMounted) setLogoSignedUrl(url);
      } else {
        if (isMounted) setLogoSignedUrl(null);
      }
    }
    fetchLogo();
    return () => {
      isMounted = false;
    };
  }, [draft.logo_url, logoVersion]);

  return (
    <div className="mb-6 text-center">
      {logoSignedUrl && (
        <div className="mb-2 flex justify-center">
          <img
            src={logoSignedUrl}
            alt="Logo"
            className="h-16 w-auto object-contain"
            onError={(e) => {
              // Hide the image if it fails to load
              e.currentTarget.style.display = "none";
              // Also maybe nullify state to avoid taking up space
              setLogoSignedUrl(null);
            }}
          />
        </div>
      )}
      <h1 className="text-2xl font-bold uppercase tracking-wide text-black">
        {draft.institute_name || "Institute Name"}
      </h1>
      <h2 className="mt-1 text-xl font-bold text-black">
        {draft.paper_title || "Examination Paper"} {titleSuffix}
      </h2>
      <div className="mt-4 border-y-2 border-black py-2">
        <div className="flex justify-between px-2 text-sm font-bold text-black">
          <div className="flex flex-col items-start gap-1">
            <span>Subject: {draft.subject_name || "..................."}</span>
            <span>
              Class: {draft.school_class_name || "..................."}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span>Max. Marks: {draft.maximum_marks || "..."}</span>
            <span>Duration: {formatTime(draft.paper_duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
