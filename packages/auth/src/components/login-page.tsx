import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "@skolist/ui";
import { cn } from "@skolist/utils";
import { useAuth } from "../context";
import {
  phoneLoginSchema,
  otpVerificationSchema,
  emailLoginSchema,
  emailSignupSchema,
  type PhoneLoginFormData,
  type OtpVerificationFormData,
  // type EmailLoginFormData,
  type EmailSignupFormData,
} from "../schemas";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { firebaseAuth } from "../firebase";
import {
  LeftPanel,
  LeftPanelHeadline,
  LeftPanelBranding,
  LeftPanelFeatures,
  LeftPanelCTA,
  LeftPanelBanner,
  LeftPanelContact,
} from "./left-panel";
import "./login-page.css";

// Icons (keeping existing icons...)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function IITBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
      <path
        d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"
        fill="#1A1A1A"
      />
    </svg>
  );
}

function TrustBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
      <path
        d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"
        fill="#1A1A1A"
      />
    </svg>
  );
}

interface LoginPageProps {
  title?: string;
  description?: string;
  onSuccess?: () => void;
  className?: string;
  enabledMethods?: ("email" | "google" | "phone")[];
  productName?: string;
  productTagline?: string;
  showLeftPanel?: boolean;
  logoUrl?: string;
}

export function LoginPage({
  onSuccess,
  className,
  enabledMethods = ["phone", "google", "email"],
  productName = "QGEN",
  productTagline = "To use the QGEN",
  showLeftPanel = true,
  logoUrl,
}: LoginPageProps) {
  const {
    signInWithOAuth,
    signInWithPhone,
    verifyOtp,
    checkUserExists,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check valid env var (support VITE_ prefix or standard if configured)
  const envVite = import.meta.env.VITE_PHONE_SMS_AVAILABLE;

  const isPhoneAvailable = (envVite || "false").toLowerCase() !== "false";

  // Auth state management
  const [isSignUp, setIsSignUp] = useState(true);
  const [authMethod, setAuthMethod] = useState<"phone" | "email">(() => {
    return isPhoneAvailable ? "phone" : "email";
  });
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  // Phone/OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");

  // Phone Form
  const phoneForm = useForm<PhoneLoginFormData & { name?: string }>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: { name: "", phone: "" },
  });

  // OTP Form
  const otpForm = useForm<OtpVerificationFormData>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: { otp: "" },
  });

  // Email Form
  const emailForm = useForm<EmailSignupFormData>({
    // Use largest schema type for TS, validation changes dynamically
    resolver: zodResolver(isSignUp ? emailSignupSchema : emailLoginSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  // Firebase State
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  // Initialize Recaptcha
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        firebaseAuth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
          },
        }
      );
    }
  };

  // Handlers
  const handlePhoneSubmit = async (
    data: PhoneLoginFormData & { name?: string }
  ) => {
    setIsLoading(true);
    setError(null);
    const fullPhone = `${countryCode}${data.phone}`;

    try {
      if (!isSignUp) {
        const exists = await checkUserExists(fullPhone);
        if (!exists) {
          setError("No account found. Please Sign Up.");
          setIsLoading(false);
          return;
        }
      }

      // 1. Setup Recaptcha
      try {
        setupRecaptcha();
      } catch (e) {
        console.error("Recaptcha setup error:", e);
        // Continue anyway, it might be already set up
      }

      const appVerifier = window.recaptchaVerifier;

      // 2. Trigger Firebase SMS
      // We do this concurrently with Supabase to save time, OR sequentially.
      // Let's do parallel but handle errors carefully.

      const firebasePromise = signInWithPhoneNumber(
        firebaseAuth,
        fullPhone,
        appVerifier
      );

      const name = isSignUp ? data.name || "" : "";
      const supabasePromise = signInWithPhone(fullPhone, name);

      const [firebaseResult, supabaseResult] = await Promise.allSettled([
        firebasePromise,
        supabasePromise,
      ]);

      // Check results
      if (firebaseResult.status === "rejected") {
        console.error("Firebase Auth Error:", firebaseResult.reason);
        throw new Error(
          firebaseResult.reason.message || "Failed to send SMS (Firebase)"
        );
      }

      if (supabaseResult.status === "rejected") {
        console.error("Supabase Auth Error:", supabaseResult.reason);
        // If supabase fails, we can't login anyway
        throw new Error("Failed to initialize login (Supabase)");
      } else if (supabaseResult.value.error) {
        throw new Error(supabaseResult.value.error.message);
      }

      // Success
      setConfirmationResult(firebaseResult.value);
      setPhoneNumber(fullPhone);
      setOtpSent(true);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
      // Reset reCAPTCHA just in case
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (data: OtpVerificationFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!confirmationResult) {
        throw new Error("Session expired. Please request OTP again.");
      }

      // 1. Verify with Firebase
      const result = await confirmationResult.confirm(data.otp);
      const user = result.user;
      const idToken = await user.getIdToken();

      // 2. Exchange Token with Backend
      const apiUrl =
        import.meta.env.VITE_FASTAPI_URL || "http://localhost:8080";
      const exchangeRes = await fetch(
        `${apiUrl}/api/v1/auth/exchange-firebase-token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firebase_token: idToken }),
        }
      );

      if (!exchangeRes.ok) {
        const errData = await exchangeRes.json();
        throw new Error(
          errData.detail || "Failed to retrieve authentication verification."
        );
      }

      const { otp: supabaseOtp } = await exchangeRes.json();

      // 3. Verify with Supabase
      const { error } = await verifyOtp(phoneNumber, supabaseOtp);

      if (error) {
        throw error;
      } else {
        onSuccess?.();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (data: EmailSignupFormData) => {
    setIsLoading(true);
    setError(null);

    let result;
    if (isSignUp) {
      result = await signUpWithEmail(
        data.email,
        data.password,
        data.name || ""
      );
    } else {
      result = await signInWithEmail(data.email, data.password);
    }

    setIsLoading(false);
    if (result.error) {
      setError(result.error.message);
    } else {
      if (isSignUp) {
        setSubmittedEmail(data.email);
        setShowEmailConfirmation(true);
      } else {
        onSuccess?.();
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const { error } = await signInWithOAuth("google");
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const showGoogle = enabledMethods.includes("google");

  return (
    <div
      className={cn(
        "login-page-container",
        !showLeftPanel && "login-page-container--centered",
        className
      )}
    >
      {showLeftPanel && (
        <LeftPanel productName={productName} logoUrl={logoUrl} />
      )}

      <div className="login-right-panel">
        <div className="login-right-panel__content">
          {/* Mobile Marketing Header */}
          <div className="login-mobile-marketing">
            <LeftPanelHeadline />
            <LeftPanelBranding productName={productName} />
          </div>

          {/* Header */}
          <div className="login-right-panel__header">
            <h2 className="login-right-panel__title">
              {isSignUp ? "Sign Up Now" : "Welcome Back"}
            </h2>
            <p className="login-right-panel__subtitle">{productTagline}</p>
            <div className="login-right-panel__toggle">
              {isSignUp ? "Already have an account? " : "New to QGEN? "}
              <span
                className="login-right-panel__toggle-link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setOtpSent(false);
                  // Reset form errors
                  emailForm.reset();
                  phoneForm.reset();
                }}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </span>
            </div>
          </div>

          {/* Form Card */}
          <div className="login-right-panel__form-card">
            {error && (
              <div className="login-form__error">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}

            {/* Email Confirmation View */}
            {authMethod === "email" && showEmailConfirmation ? (
              <div className="animate-enter flex flex-col items-center justify-center space-y-4 py-4 text-center">
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--login-teal)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>

                <h3 className="font-serif text-xl font-medium text-[var(--login-teal)]">
                  Check your inbox
                </h3>

                <div className="space-y-2">
                  <p className="font-sans text-sm text-gray-600">
                    Confirmation link has been sent on your email, kindly check
                    it
                  </p>
                  <p className="font-sans text-lg font-medium text-gray-900">
                    {submittedEmail}
                  </p>
                </div>

                <div className="w-full pt-4">
                  <p className="mb-2 text-xs text-gray-500">
                    If you have entered wrong email mistakenly
                  </p>
                  <button
                    onClick={() => setShowEmailConfirmation(false)}
                    className="login-form__submit border border-gray-300 bg-gray-100 text-gray-700 shadow-none hover:bg-gray-200"
                  >
                    Re-enter correct email address
                  </button>
                </div>
              </div>
            ) : (
              /* Normal Form Content */
              <>
                {authMethod === "phone" ? (
                  /* Phone Flow */
                  !otpSent ? (
                    <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)}>
                      {isSignUp && (
                        <div className="login-form__group">
                          <label className="login-form__label">Name</label>
                          <input
                            className="login-form__input"
                            placeholder="Enter your Name"
                            {...phoneForm.register("name")}
                          />
                          {phoneForm.formState.errors.name && (
                            <span className="mt-1 block text-xs text-red-500">
                              {phoneForm.formState.errors.name.message}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="login-form__group">
                        <label className="login-form__label">
                          Phone Number
                        </label>
                        <div className="login-form__phone-group">
                          <select
                            className="login-form__country-code"
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                          >
                            <option value="+91">(91+)</option>
                            <option value="+1">(1+)</option>
                          </select>
                          <input
                            className="login-form__input login-form__phone-input"
                            placeholder="Enter your number"
                            type="tel"
                            {...phoneForm.register("phone")}
                          />
                        </div>
                        {phoneForm.formState.errors.phone && (
                          <span className="mt-1 block text-xs text-red-500">
                            {phoneForm.formState.errors.phone.message}
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="login-form__submit"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Spinner size="sm" className="text-white" />
                        ) : (
                          "Send OTP"
                        )}
                      </button>
                      <div id="recaptcha-container"></div>
                    </form>
                  ) : (
                    <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)}>
                      <div className="login-form__group">
                        <p className="login-form__otp-info">
                          Enter the code sent to {phoneNumber}
                        </p>
                        <input
                          className="login-form__input login-form__otp-input"
                          placeholder="000000"
                          maxLength={6}
                          {...otpForm.register("otp")}
                        />
                        {otpForm.formState.errors.otp && (
                          <span className="mt-1 block text-center text-xs text-red-500">
                            {otpForm.formState.errors.otp.message}
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
                          onClick={() => setOtpSent(false)}
                        >
                          Change phone number
                        </button>
                      </div>
                    </form>
                  )
                ) : (
                  /* Email Flow */
                  <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
                    {isSignUp && (
                      <div className="login-form__group">
                        <label className="login-form__label">Name</label>
                        <input
                          className="login-form__input"
                          placeholder="Enter your Name"
                          {...emailForm.register("name")}
                        />
                        {emailForm.formState.errors.name && (
                          <span className="mt-1 block text-xs text-red-500">
                            {emailForm.formState.errors.name.message}
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
                        {...emailForm.register("email")}
                      />
                      {emailForm.formState.errors.email && (
                        <span className="mt-1 block text-xs text-red-500">
                          {emailForm.formState.errors.email.message}
                        </span>
                      )}
                    </div>

                    <div className="login-form__group">
                      <label className="login-form__label">Password</label>
                      <input
                        className="login-form__input"
                        placeholder="Enter password"
                        type="password"
                        {...emailForm.register("password")}
                      />
                      {emailForm.formState.errors.password && (
                        <span className="mt-1 block text-xs text-red-500">
                          {emailForm.formState.errors.password.message}
                        </span>
                      )}
                    </div>

                    {isSignUp && (
                      <div className="login-form__group">
                        <label className="login-form__label">
                          Confirm Password
                        </label>
                        <input
                          className="login-form__input"
                          placeholder="Confirm password"
                          type="password"
                          {...emailForm.register("confirmPassword")}
                        />
                        {emailForm.formState.errors.confirmPassword && (
                          <span className="mt-1 block text-xs text-red-500">
                            {emailForm.formState.errors.confirmPassword.message}
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="login-form__submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Spinner size="sm" className="text-white" />
                      ) : isSignUp ? (
                        "Create Account"
                      ) : (
                        "Sign In"
                      )}
                    </button>
                  </form>
                )}

                {/* Toggle Auth Method (Only if not in OTP mode AND Phone is available) */}
                {!otpSent && isPhoneAvailable && (
                  <div className="text-center">
                    <button
                      type="button"
                      className="login-form__toggle-method-btn"
                      onClick={() => {
                        setAuthMethod(
                          authMethod === "phone" ? "email" : "phone"
                        );
                        setError(null);
                      }}
                    >
                      {authMethod === "phone"
                        ? "Use Email Address"
                        : "Use Phone Number"}
                    </button>
                  </div>
                )}

                {/* Social Divider */}
                {!otpSent && (
                  <>
                    <div className="login-right-panel__divider">Or</div>

                    {showGoogle && (
                      <button
                        className="login-google-btn"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            <GoogleIcon className="mr-2 h-4 w-4" />
                            Continue with Google
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Badges */}
          <div className="login-right-panel__badges">
            <div className="login-badge">
              <div className="login-badge__icon">
                <IITBadgeIcon />
              </div>
              <div className="login-badge__text">
                Built by founders from <span>IIT Delhi</span>
              </div>
            </div>
            <div className="login-badge">
              <div className="login-badge__icon">
                <TrustBadgeIcon />
              </div>
              <div className="login-badge__text">
                Trusted by 1,000+ teacher/schools
              </div>
            </div>
          </div>

          {/* Mobile Footer Marketing */}
          <div className="login-mobile-footer">
            <LeftPanelFeatures />
            <LeftPanelCTA productName={productName} />
            <LeftPanelBanner />
            <LeftPanelContact
              contactInfo={{
                email: "info@skolist.com",
                phone: "+91 7667366098",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
