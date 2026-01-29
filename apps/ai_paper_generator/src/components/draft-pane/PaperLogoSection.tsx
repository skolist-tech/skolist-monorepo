import { useState, useEffect } from "react";
import { Trash2, Upload } from "lucide-react";
import { Button, Label, Switch } from "@skolist/ui";
import { useDraftContext } from "../../context/DraftContext";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { getSignedLogoUrl } from "../../services/draftService";
import type { QgenDraft, UpdateQgenDraft } from "@skolist/db";

interface PaperLogoSectionProps {
  draft: QgenDraft;
  updateDraftSettings: (updates: UpdateQgenDraft) => Promise<void>;
}

export function PaperLogoSection({
  draft,
  updateDraftSettings,
}: PaperLogoSectionProps) {
  const { refreshLogo, logoVersion } = useDraftContext();
  const [isLogoSectionOpen, setIsLogoSectionOpen] = useState(!!draft.logo_url);
  const [logoSignedUrl, setLogoSignedUrl] = useState<string | null>(null);
  const [isDeleteLogoModalOpen, setIsDeleteLogoModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchLogo() {
      if (draft.logo_url && draft.logo_url.startsWith("http")) {
        // Legacy support if URL is stored
        if (isMounted) setLogoSignedUrl(draft.logo_url);
        return;
      }
      if (draft.logo_url) {
        // Append a cache buster or rely on Signed URL uniqueness?
        // Usually signed URL is enough, but effectively fetching it again
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

  useEffect(() => {
    if (draft.logo_url) setIsLogoSectionOpen(true);
  }, [draft.logo_url]);

  const handleDeleteLogo = async () => {
    if (!draft.activity_id) return;
    try {
      const { deleteLogo } = await import("../../services/draftService");
      await deleteLogo(draft.activity_id);
      updateDraftSettings({ logo_url: null });
      setIsDeleteLogoModalOpen(false);
    } catch (err) {
      console.error("Failed to delete logo", err);
    }
  };

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">
          SHOW LOGO ON PAPER
        </Label>
        <div className="flex h-5 items-center">
          <Switch
            checked={!!draft.logo_url || isLogoSectionOpen}
            onCheckedChange={async (checked) => {
              setIsLogoSectionOpen(checked);
              if (!checked) {
                updateDraftSettings({ logo_url: null });
              } else {
                // Restore path ONLY if file exists
                if (draft.activity_id) {
                  try {
                    const { hasLogo } =
                      await import("../../services/draftService");
                    const exists = await hasLogo(draft.activity_id);

                    if (exists) {
                      updateDraftSettings({
                        logo_url: `${draft.activity_id}/logo.png`,
                      });
                      refreshLogo();
                    }
                  } catch (err) {
                    console.error("Failed to check logo existence", err);
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {(!!draft.logo_url || isLogoSectionOpen) && (
        <div className="mt-2">
          <div className="flex items-center gap-3">
            {logoSignedUrl ? (
              <div className="relative h-12 w-12 overflow-hidden rounded border bg-white p-1">
                <img
                  src={logoSignedUrl}
                  alt="Logo"
                  className="h-full w-full object-contain"
                  onError={() => setLogoSignedUrl(null)}
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded border border-dashed bg-muted/20" />
            )}

            <div className="flex items-center gap-2">
              <Label
                htmlFor="logo-upload"
                className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                <Upload className="h-3.5 w-3.5 text-white" />
                {draft.logo_url ? "Change Logo" : "Upload Logo"}
              </Label>
              <input
                id="logo-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file && draft.activity_id) {
                    try {
                      const { uploadLogo } =
                        await import("../../services/draftService");

                      // uploadLogo returns { status, path }
                      const { path } = await uploadLogo(
                        file,
                        draft.activity_id
                      );

                      if (path) {
                        updateDraftSettings({ logo_url: path });
                        refreshLogo();
                      }
                    } catch (err) {
                      console.error("Upload failed", err);
                      alert("Failed to upload logo.");
                    }
                  }
                }}
              />
              {/* Delete Button */}
              {draft.logo_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => setIsDeleteLogoModalOpen(true)}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={isDeleteLogoModalOpen}
        onOpenChange={setIsDeleteLogoModalOpen}
        title="Remove Logo"
        description="Are you sure you want to remove the logo from this paper?"
        onConfirm={handleDeleteLogo}
        variant="destructive"
        confirmLabel="Remove"
      />
    </div>
  );
}
