import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@skolist/utils";
import { useAuth } from "../../context";
import {
  phoneLoginSchema,
  otpVerificationSchema,
  emailLoginSchema,
  emailSignupSchema,
  type PhoneLoginFormData,
  type OtpVerificationFormData,
  type EmailSignupFormData,
} from "../../schemas";

import { signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { firebaseAuth } from "../../firebase";
import {
  LeftPanel,
  LeftPanelHeadline,
  LeftPanelBranding,
  LeftPanelFeatures,
  LeftPanelCTA,
  LeftPanelBanner,
  LeftPanelContact,
} from "../left-panel";

import { useRecaptcha } from "./use-recaptcha";
import { PhoneLoginForm, OtpVerifyForm, EmailLoginForm } from "./forms";
import { GoogleSignInButton } from "./social";
import { ErrorDisplay, EmailConfirmation, TrustBadges } from "./shared";
import "./login-page.css";

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

  // Check valid env var
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

  // Firebase State
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  // Recaptcha Hook
  const { recaptchaContainerRef, setupRecaptcha } = useRecaptcha(
    authMethod,
    otpSent
  );

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
    resolver: zodResolver(isSignUp ? emailSignupSchema : emailLoginSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

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

      const appVerifier = setupRecaptcha();
      if (!appVerifier) {
        throw new Error(
          "Failed to initialize security verification (reCAPTCHA)"
        );
      }

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

      if (firebaseResult.status === "rejected") {
        console.error("Firebase Auth Error:", firebaseResult.reason);
        throw new Error(
          firebaseResult.reason.message || "Failed to send SMS (Firebase)"
        );
      }

      if (supabaseResult.status === "rejected") {
        console.error("Supabase Auth Error:", supabaseResult.reason);
        throw new Error("Failed to initialize login (Supabase)");
      } else if (supabaseResult.value.error) {
        throw new Error(supabaseResult.value.error.message);
      }

      setConfirmationResult(firebaseResult.value);
      setPhoneNumber(fullPhone);
      setOtpSent(true);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
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

      const result = await confirmationResult.confirm(data.otp);
      const user = result.user;
      const idToken = await user.getIdToken();

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

  const handleToggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setOtpSent(false);
    emailForm.reset();
    phoneForm.reset();
  };

  const handleToggleAuthMethod = () => {
    setAuthMethod(authMethod === "phone" ? "email" : "phone");
    setError(null);
  };

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
                onClick={handleToggleSignUp}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </span>
            </div>
          </div>

          {/* Form Card */}
          <div className="login-right-panel__form-card">
            <ErrorDisplay error={error} />

            {/* Email Confirmation View */}
            {authMethod === "email" && showEmailConfirmation ? (
              <EmailConfirmation
                email={submittedEmail}
                onRetry={() => setShowEmailConfirmation(false)}
              />
            ) : (
              <>
                {authMethod === "phone" ? (
                  !otpSent ? (
                    <PhoneLoginForm
                      form={phoneForm}
                      isSignUp={isSignUp}
                      isLoading={isLoading}
                      countryCode={countryCode}
                      onCountryCodeChange={setCountryCode}
                      onSubmit={handlePhoneSubmit}
                      recaptchaContainerRef={recaptchaContainerRef}
                      otpSent={otpSent}
                      authMethod={authMethod}
                    />
                  ) : (
                    <OtpVerifyForm
                      form={otpForm}
                      phoneNumber={phoneNumber}
                      isLoading={isLoading}
                      onSubmit={handleOtpSubmit}
                      onChangeNumber={() => setOtpSent(false)}
                    />
                  )
                ) : (
                  <EmailLoginForm
                    form={emailForm}
                    isSignUp={isSignUp}
                    isLoading={isLoading}
                    onSubmit={handleEmailSubmit}
                  />
                )}

                {/* Toggle Auth Method */}
                {!otpSent && isPhoneAvailable && (
                  <div className="text-center">
                    <button
                      type="button"
                      className="login-form__toggle-method-btn"
                      onClick={handleToggleAuthMethod}
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
                      <GoogleSignInButton
                        isLoading={isLoading}
                        onClick={handleGoogleSignIn}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Badges */}
          <TrustBadges />

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
