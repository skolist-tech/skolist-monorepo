import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@skolist/auth";
import { LoginIllustration } from "@/components/login/LoginIllustration";
import { signInWithOrganisation } from "@/services/auth";
import "./login.css";

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const [organisationCode, setOrganisationCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit =
    organisationCode.trim().length === 6 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    !isLoading;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await signInWithOrganisation({
        email: email.trim(),
        password,
        organisationCode: organisationCode.trim(),
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="assessments-login">
      <section className="assessments-login__left">
        <h1 className="assessments-login__headline">
          The future of education is here
        </h1>
        <p className="assessments-login__lede">
          With an all in one platform for the teaching world
        </p>
        <LoginIllustration />
      </section>

      <section className="assessments-login__right">
        <div className="assessments-login__panel">
          <h2 className="assessments-login__title">Login to your account</h2>
          <p className="assessments-login__subtitle">
            Please enter the org code, email and password to continue
          </p>

          <form onSubmit={(event) => void handleSubmit(event)}>
            {error && (
              <p
                className="assessments-login__error login-form__error"
                role="alert"
              >
                {error}
              </p>
            )}

            <div className="assessments-login__group">
              <label className="assessments-login__label" htmlFor="org-code">
                Org code
              </label>
              <input
                id="org-code"
                className="assessments-login__input assessments-login__input--code"
                placeholder="Enter org code"
                autoComplete="organization"
                maxLength={6}
                value={organisationCode}
                onChange={(event) =>
                  setOrganisationCode(
                    event.target.value.toUpperCase().replace(/[^A-Z]/g, "")
                  )
                }
                required
              />
            </div>

            <div className="assessments-login__group">
              <label className="assessments-login__label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="assessments-login__input"
                placeholder="name@example.com"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="assessments-login__group">
              <label className="assessments-login__label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="assessments-login__input"
                placeholder="Enter password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="assessments-login__submit"
              disabled={!canSubmit}
            >
              {isLoading ? "Signing in…" : "Proceed Securely"}
            </button>
          </form>

          <p className="assessments-login__terms">
            By continuing, you agree to the{" "}
            <span className="assessments-login__terms-link">
              terms and conditions
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
