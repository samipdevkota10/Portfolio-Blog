export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 lg:px-8">
      <div className="h-10 w-52 animate-pulse rounded-full bg-black/10" />
      <div className="mt-8 h-20 max-w-3xl animate-pulse rounded-[2rem] bg-black/10" />
      <div className="mt-6 h-20 max-w-2xl animate-pulse rounded-[2rem] bg-black/10" />
    </div>
  );
}
