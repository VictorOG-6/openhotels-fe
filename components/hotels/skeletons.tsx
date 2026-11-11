export function BrowseSkeleton() {
  return (
    <div className="bg-paper pt-16" aria-hidden>
      <div className="border-b border-line">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="h-16 animate-pulse rounded-full bg-white" />
          <div className="mx-auto mt-3 h-10 max-w-xl animate-pulse rounded-full bg-sand" />
        </div>
      </div>
      <div className="mx-auto grid max-w-[1440px] gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
        <div className="hidden h-[calc(100vh-12rem)] animate-pulse rounded-3xl bg-sand lg:block" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-24" aria-hidden>
      <div className="h-8 w-40 animate-pulse rounded-full bg-sand" />
      <div className="mt-6 h-80 animate-pulse rounded-3xl bg-sand" />
      <div className="mt-8 h-10 w-2/3 animate-pulse rounded-full bg-sand" />
      <div className="mt-6 space-y-3">
        <div className="h-36 animate-pulse rounded-3xl bg-white" />
        <div className="h-36 animate-pulse rounded-3xl bg-white" />
      </div>
    </div>
  );
}
