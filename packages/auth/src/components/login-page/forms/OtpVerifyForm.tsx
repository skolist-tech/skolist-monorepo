import type { UseFormReturn } from "react-hook-form";
import { Spinner } from "@skolist/ui";
import type { OtpVerificationFormData } from "../../../schemas";

interface OtpVerifyFormProps {
  form: UseFormReturn<OtpVerificationFormData>;
  phoneNumber: string;
  isLoading: boolean;
  onSubmit: (data: OtpVerificationFormData) => void;
  onChangeNumber: () => void;
}

export function OtpVerifyForm({
  form,
  phoneNumber,
  isLoading,
  onSubmit,
  onChangeNumber,
}: OtpVerifyFormProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="login-form__group">
        <p className="login-form__otp-info">
          Enter the code sent to {phoneNumber}
        </p>
        <input
          className="login-form__input login-form__otp-input"
          placeholder="000000"
          maxLength={6}
          {...form.register("otp")}
        />
        {form.formState.errors.otp && (
          <span className="mt-1 block text-center text-xs text-red-500">
            {form.formState.errors.otp.message}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <button
          type="submit"
          className="login-form__submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner size="sm" className="text-white" />
          ) : (
            "Verify & Continue"
          )}
        </button>
        <button
          type="button"
          className="login-form__back-btn"
          onClick={onChangeNumber}
        >
          Change phone number
        </button>
      </div>
    </form>
  );
}
