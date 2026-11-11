interface Props {
  children: React.ReactNode;
  wide?: boolean;
}

export default function Card({ children, wide = false }: Props) {
  return (
    <div
      className={`relative w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl`}
    >
      {children}
    </div>
  );
}
