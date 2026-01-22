import React from "react";
import "./login-page.css";

// Default feature pills from the reference design
export const DEFAULT_FEATURES = [
  "Concept level generator",
  "100% board aligned",
  "Instant formatting",
  "Easy customization",
  "Accurate & Reliable",
  "Detailed Analysis",
];

export function LeftPanelHeadline({
  headline,
}: {
  headline?: React.ReactNode;
}) {
  return (
    <h2 className="login-left-panel__headline animate-enter delay-1">
      {headline || (
        <>
          <span className="login-left-panel__headline-red">
            INSTANTLY CHOOSE FROM
          </span>
          <br />
          <span className="login-left-panel__headline-dark">
            MILLIONS OF QUESTIONS
          </span>{" "}
          <span className="login-left-panel__headline-red">WITH</span>
          <br />
          <span className="login-left-panel__headline-blue">
            AUTO-FORMATTING
          </span>
        </>
      )}
    </h2>
  );
}

export function LeftPanelBranding({
  productName = "QGEN",
}: {
  productName?: string;
}) {
  return (
    <div className="login-left-panel__branding animate-enter delay-2">
      <div className="login-left-panel__branding-icon">📚</div>
      <h1 className="login-left-panel__branding-name">{productName}</h1>
      <p className="login-left-panel__branding-subtitle">Built by Skolist</p>
    </div>
  );
}

export function LeftPanelFeatures({
  features = DEFAULT_FEATURES,
}: {
  features?: string[];
}) {
  return (
    <div className="login-left-panel__features animate-enter delay-3">
      {features.map((feature, index) => (
        <div
          key={index}
          className="login-left-panel__feature-pill"
          style={{ animationDelay: `${300 + index * 50}ms` }}
        >
          {feature}
        </div>
      ))}
    </div>
  );
}

export function LeftPanelCTA({
  productName = "QGEN",
}: {
  productName?: string;
}) {
  return (
    <div className="login-left-panel__cta animate-enter delay-4">
      <p className="login-left-panel__cta-main">
        Use the next-generation tool <span>{productName} for free</span>
      </p>
      <p className="login-left-panel__cta-sub">
        A product made with teachers, not just for them
      </p>
    </div>
  );
}

export function LeftPanelBanner() {
  return (
    <div className="login-left-panel__banner animate-enter delay-5">
      QUESTION PAPER GENERATION IS
      <br />
      NOW EASIER
    </div>
  );
}

export function LeftPanelContact({
  contactInfo,
}: {
  contactInfo: { email: string; phone: string };
}) {
  return (
    <div className="login-left-panel__contact animate-enter delay-5">
      Any Queries : {contactInfo.email} / {contactInfo.phone}
    </div>
  );
}

interface LeftPanelProps {
  headline?: React.ReactNode;
  productName?: string;
  features?: string[];
  contactInfo?: {
    email: string;
    phone: string;
  };
  logoUrl?: string;
}

export function LeftPanel({
  headline,
  productName = "QGEN",
  features = DEFAULT_FEATURES,
  contactInfo = {
    email: "info@skolist.com",
    phone: "+91 7667366098",
  },
  logoUrl = "/logo.png",
}: LeftPanelProps) {
  return (
    <div className="login-left-panel">
      {/* Logo */}
      {logoUrl && (
        <div className="login-left-panel__logo animate-enter">
          <img src={logoUrl} alt="Logo" />
        </div>
      )}

      {/* Main Headline */}
      <LeftPanelHeadline headline={headline} />

      {/* Product Branding */}
      <LeftPanelBranding productName={productName} />

      {/* Feature Pills */}
      <LeftPanelFeatures features={features} />

      {/* Call to Action Text */}
      <LeftPanelCTA productName={productName} />

      {/* Bottom Banner */}
      <LeftPanelBanner />

      {/* Contact Info */}
      <LeftPanelContact contactInfo={contactInfo} />
    </div>
  );
}
