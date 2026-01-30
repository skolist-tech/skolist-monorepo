interface EmailConfirmationProps {
  email: string;
  onRetry: () => void;
}

export function EmailConfirmation({ email, onRetry }: EmailConfirmationProps) {
  return (
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
          Confirmation link has been sent on your email, kindly check it
        </p>
        <p className="font-sans text-lg font-medium text-gray-900">{email}</p>
      </div>

      <div className="w-full pt-4">
        <p className="mb-2 text-xs text-gray-500">
          If you have entered wrong email mistakenly
        </p>
        <button
          onClick={onRetry}
          className="login-form__submit border border-gray-300 bg-gray-100 text-gray-700 shadow-none hover:bg-gray-200"
        >
          Re-enter correct email address
        </button>
      </div>
    </div>
  );
}
