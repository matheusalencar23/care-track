import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link>;

/** Link com o mesmo visual do `Button`, para ações que só navegam. */
export default function LinkButton({ className = "", ...props }: Props) {
  return (
    <Link
      className={`mt-4 block w-full rounded-xl bg-white py-3 text-center font-semibold text-blue-700 transition hover:scale-[1.02] ${className}`}
      {...props}
    />
  );
}
