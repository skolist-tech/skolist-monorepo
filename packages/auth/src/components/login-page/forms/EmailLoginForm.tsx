import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Spinner } from "@skolist/ui";
import type { EmailSignupFormData } from "../../../schemas";

interface EmailLoginFormProps {
  form: UseFormReturn<EmailSignupFormData>;
  isSignUp: boolean;
  isLoading: boolean;
  onSubmit: (data: EmailSignupFormData) => void;
}

export function EmailLoginForm({
  form,
  isSignUp,
  isLoading,
  onSubmit,
}: EmailLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        <label className="login-form__label">Email Address</label>
        <input
          className="login-form__input"
          placeholder="name@example.com"
          type="email"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <span className="mt-1 block text-xs text-red-500">
            {form.formState.errors.email.message}
          </span>
        )}
      </div>

      <div className="login-form__group">
        <label className="login-form__label">Password</label>
        <div className="login-form__password-wrapper">
          <input
            className="login-form__input login-form__input--password"
            placeholder="Enter password"
            type={showPassword ? "text" : "password"}
            {...form.register("password")}
          />
          <button
            type="button"
            className="login-form__password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
        {form.formState.errors.password && (
          <span className="mt-1 block text-xs text-red-500">
            {form.formState.errors.password.message}
          </span>
        )}
      </div>

      {isSignUp && (
        <div className="login-form__group">
          <label className="login-form__label">Confirm Password</label>
          <div className="login-form__password-wrapper">
            <input
              className="login-form__input login-form__input--password"
              placeholder="Confirm password"
              type={showConfirmPassword ? "text" : "password"}
              {...form.register("confirmPassword")}
            />
            <button
              type="button"
              className="login-form__password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {form.formState.errors.confirmPassword && (
            <span className="mt-1 block text-xs text-red-500">
              {form.formState.errors.confirmPassword.message}
            </span>
          )}
        </div>
      )}

      <button type="submit" className="login-form__submit" disabled={isLoading}>
        {isLoading ? (
          <Spinner size="sm" className="text-white" />
        ) : isSignUp ? (
          "Create Account"
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
