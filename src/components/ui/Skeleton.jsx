// Skeleton loading components for initial page loads

// Base skeleton element with pulse animation
export function Skeleton({ className = "", variant = "rectangular" }) {
  const baseClasses = "animate-pulse bg-gray-200";

  const variantClasses = {
    rectangular: "rounded",
    circular: "rounded-full",
    text: "rounded h-4",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
}

// Skeleton for a card layout
export function SkeletonCard({ className = "" }) {
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" className="h-10 w-10" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-5/6 mb-2" />
      <Skeleton className="h-3 w-4/6" />
    </div>
  );
}

// Skeleton for resource list items
export function SkeletonResourceCard({ className = "" }) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Skeleton className="h-6 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

// Skeleton for case management sections
export function SkeletonCaseSection({ className = "" }) {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" className="h-8 w-8" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-8 w-24 rounded" />
        </div>
      </div>
      {/* Content */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

// Skeleton for family member rows
export function SkeletonFamilyMember({ className = "" }) {
  return (
    <div className={`flex items-center gap-4 p-3 bg-gray-50 rounded-lg ${className}`}>
      <Skeleton variant="circular" className="h-10 w-10" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  );
}

// Full page skeleton for case management
export function CaseManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Case info skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>
      </div>

      {/* Section skeletons */}
      <SkeletonCaseSection />
      <SkeletonCaseSection />
      <SkeletonCaseSection />
    </div>
  );
}

// Skeleton for resource browse page
export function ResourceBrowseSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonResourceCard key={i} />
      ))}
    </div>
  );
}
