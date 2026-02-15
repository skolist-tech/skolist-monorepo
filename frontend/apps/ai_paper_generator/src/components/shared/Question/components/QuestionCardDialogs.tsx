import type { GeneratedQuestionWithConcepts } from "../../../../services/questionService";
import { ConfirmDialog } from "../../ConfirmDialog";
import { EditSvgDialog } from "./EditSvgDialog";
import { CameraCaptureDialog } from "./CameraCaptureDialog";
import { RegeneratePopover } from "./RegeneratePopover";
import type { useQuestionCardState } from "../hooks/useQuestionCardState";

interface QuestionCardDialogsProps {
  question: GeneratedQuestionWithConcepts;
  state: ReturnType<typeof useQuestionCardState>;
  onDeleteConfirm: () => Promise<void>;
  onRegenerateSubmit: () => Promise<void>;
  onCameraCapture: (file: File, customPrompt?: string) => Promise<void>;
}

export function QuestionCardDialogs({
  state,
  onDeleteConfirm,
  onRegenerateSubmit,
  onCameraCapture,
}: QuestionCardDialogsProps) {
  return (
    <>
      {/* Delete Question Dialog */}
      <ConfirmDialog
        open={state.isDeleteModalOpen}
        onOpenChange={state.setIsDeleteModalOpen}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
        onConfirm={onDeleteConfirm}
        variant="destructive"
        confirmLabel="Delete"
      />

      {/* Delete Image Dialog */}
      <ConfirmDialog
        open={state.isDeleteImageModalOpen}
        onOpenChange={state.setIsDeleteImageModalOpen}
        title="Delete Image"
        description="Are you sure you want to delete this image? This action cannot be undone."
        onConfirm={state.confirmDeleteImage}
        variant="destructive"
        confirmLabel="Delete"
      />

      {/* SVG Editor Dialog */}
      <EditSvgDialog
        image={state.imageToEdit}
        open={state.isEditSvgOpen}
        onOpenChange={state.setIsEditSvgOpen}
        onSave={state.handleSaveSvg}
        onAiUpdate={state.handleAiSvgUpdate}
        isSaving={state.isSavingSvg}
      />

      {/* Camera Capture Dialog */}
      <CameraCaptureDialog
        open={state.isCameraOpen}
        onOpenChange={(open) => {
          state.setIsCameraOpen(open);
          if (!open) state.setSelectedCameraFile(null);
        }}
        initialFile={state.selectedCameraFile}
        onCapture={onCameraCapture}
      />

      {/* Regenerate Popover */}
      <RegeneratePopover
        isOpen={state.isRegenerateOpen}
        onOpenChange={state.setIsRegenerateOpen}
        prompt={state.prompt}
        setPrompt={state.setPrompt}
        attachedFiles={state.attachedFiles}
        isAttaching={state.isAttaching}
        onRemoveAttachment={state.handleRemoveAttachment}
        onRegenerateSubmit={onRegenerateSubmit}
        onAttachmentClick={() => state.attachmentInputRef.current?.click()}
      />
    </>
  );
}
