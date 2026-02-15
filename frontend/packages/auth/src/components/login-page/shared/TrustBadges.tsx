import { IITBadgeIcon, TrustBadgeIcon } from "../icons";

export function TrustBadges() {
  return (
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
  );
}
