// Reusable spinner component for loading states

export default function Spinner({ size = "sm", color = "white", className = "" }) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
  };

  const colorClasses = {
    white: "text-white",
    plum: "text-brand-plum",
    blue: "text-brand-blue",
    gray: "text-gray-500",
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Button with built-in loading state
export function LoadingButton({
  loading = false,
  disabled = false,
  children,
  loadingText,
  className = "",
  spinnerColor = "white",
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner size="sm" color={spinnerColor} />
          {loadingText || children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
