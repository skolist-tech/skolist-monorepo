import { Spinner } from "@skolist/ui";
import { GoogleIcon } from "../icons";

interface GoogleSignInButtonProps {
  isLoading: boolean;
  onClick: () => void;
}

export function GoogleSignInButton({
  isLoading,
  onClick,
}: GoogleSignInButtonProps) {
  return (
    <button className="login-google-btn" onClick={onClick} disabled={isLoading}>
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <>
          <GoogleIcon className="mr-2 h-4 w-4" />
          Continue with Google
        </>
      )}
    </button>
  );
}
