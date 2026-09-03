import React from "react";
import Image from "next/image";
import logo from "../../../public/logo.png";
import Card from "../card";

interface Props {
  children: React.ReactNode;
  title: string;
}

export default function ExternalLayout({ title, children }: Props) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <Card>
        <div className="mb-6 flex flex-col items-center">
          <Image src={logo} alt="Logo" className="w-50 mb-2" loading="eager" />

          <h1 className="text-4xl font-bold text-blue-900">
            Care<span className="text-teal-600">Track</span>
          </h1>

          <p className="mt-2 text-center text-sm text-slate-200">{title}</p>
        </div>

        {children}
      </Card>
    </main>
  );
}
