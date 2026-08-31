import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-gray-50">
      <aside className="w-full sm:w-64 p-4 bg-white min-h-fit sm:min-h-screen">
        <div className="flex flex-col gap-8 mb-8 w-3/4 mx-auto sm:mx-0">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="h-4 flex-1 rounded-full" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
          </div>
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-full sm:max-w-5xl mb-6 sm:mb-8">
          <Skeleton className="h-8 w-2/3 sm:w-1/4 rounded-full" />
        </div>
        <section className="w-full max-w-full sm:max-w-5xl flex flex-col gap-6 sm:gap-8">
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-stretch">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex-1 flex items-center bg-white rounded-lg p-4 gap-3 shadow min-h-[100px]"
              >
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-8 min-h-[100px] flex flex-col w-full">
            <Skeleton className="h-8 w-1/2 sm:w-1/3 rounded-full mb-4 sm:mb-6" />
            <Skeleton className="h-4 w-full rounded-full mb-2 sm:mb-3" />
            <Skeleton className="h-4 w-full rounded-full mb-2 sm:mb-3" />
            <Skeleton className="h-4 w-4/6 sm:w-4/5 rounded-full mb-2 sm:mb-3" />
          </div>
        </section>
      </main>
    </div>
  );
}
