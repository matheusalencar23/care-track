import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & {
  block?: boolean;
};

/** Link com o mesmo visual do `Button`, para ações que só navegam. */
export default function LinkButton({
  block = true,
  className = "",
  ...props
}: Props) {
  return (
    <Link
      className={`rounded-xl bg-white py-3 text-center font-semibold text-blue-700 transition hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${block ? "mt-4 block w-full" : "inline-flex items-center justify-center gap-2 px-5"} ${className}`}
      {...props}
    />
  );
}
