"use client";

import { useEffect } from "react";
import ReactModal from "react-modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// TODO: Implementar o fluxo de recuperação de senha
export default function ForgotPasswordModal({ isOpen, onClose }: Props) {
  useEffect(() => {
    ReactModal.setAppElement("main");
  }, []);

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Recuperação de senha"
      style={{
        content: {
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          marginRight: "-50%",
          transform: "translate(-50%, -50%)",
          width: "min(28rem, calc(100vw - 2rem))",
          borderRadius: "1rem",
          padding: "1.5rem",
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.6)",
        },
      }}
    >
      <h2 className="text-lg font-semibold text-blue-900">
        Recuperação de senha
      </h2>

      <p className="mt-2 text-sm text-slate-600">
        Em breve você poderá redefinir sua senha por aqui. Por enquanto, entre
        em contato com o suporte.
      </p>

      <button
        type="button"
        onClick={onClose}
        className="mt-6 w-full cursor-pointer rounded-xl bg-blue-700 py-2.5 font-semibold text-white transition hover:bg-blue-800"
      >
        Fechar
      </button>
    </ReactModal>
  );
}
