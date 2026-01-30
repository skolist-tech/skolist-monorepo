import { UseFormReturn } from "react-hook-form";
import { Spinner } from "@skolist/ui";
import type { PhoneLoginFormData } from "../../../schemas";

interface PhoneLoginFormProps {
  form: UseFormReturn<PhoneLoginFormData & { name?: string }>;
  isSignUp: boolean;
  isLoading: boolean;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  onSubmit: (data: PhoneLoginFormData & { name?: string }) => void;
  recaptchaContainerRef: React.RefObject<HTMLDivElement>;
  otpSent: boolean;
  authMethod: "phone" | "email";
}

export function PhoneLoginForm({
  form,
  isSignUp,
  isLoading,
  countryCode,
  onCountryCodeChange,
  onSubmit,
  recaptchaContainerRef,
  otpSent,
  authMethod,
}: PhoneLoginFormProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {isSignUp && (
        <div className="login-form__group">
          <label className="login-form__label">Name</label>
          <input
            className="login-form__input"
            placeholder="Enter your Name"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <span className="mt-1 block text-xs text-red-500">
              {form.formState.errors.name.message}
            </span>
          )}
        </div>
      )}

      <div className="login-form__group">
        <label className="login-form__label">Phone Number</label>
        <div className="login-form__phone-group">
          <select
            className="login-form__country-code"
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
          >
            <option value="+91">(91+)</option>
            <option value="+1">(1+)</option>
          </select>
          <input
            className="login-form__input login-form__phone-input"
            placeholder="Enter your number"
            type="tel"
            {...form.register("phone")}
          />
        </div>
        {form.formState.errors.phone && (
          <span className="mt-1 block text-xs text-red-500">
            {form.formState.errors.phone.message}
          </span>
        )}
      </div>

      <button type="submit" className="login-form__submit" disabled={isLoading}>
        {isLoading ? <Spinner size="sm" className="text-white" /> : "Send OTP"}
      </button>

      {/* Use a unique key to ensure a fresh DOM element when needed */}
      <div
        key={`recaptcha-${otpSent}-${authMethod}`}
        ref={recaptchaContainerRef}
      ></div>
    </form>
  );
}
