export default function Button({
  isDisabled = false,
  children,
}: {
  isDisabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      className="mt-4 w-full rounded-xl bg-white py-3 font-semibold text-blue-700 transition hover:cursor-pointer hover:scale-[1.02] disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
      disabled={isDisabled}
    >
      {children}
    </button>
  );
}
