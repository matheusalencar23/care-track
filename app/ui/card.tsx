export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl">
      {children}
    </div>
  );
}
