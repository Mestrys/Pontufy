"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Copy, Coins, Loader2, ExternalLink } from "lucide-react";
import { triggerRewardRedemption } from "@/hooks/useApi";

type CheckoutStep = "confirm" | "loading" | "success";

interface Reward {
  id: string;
  title: string;
  partnerStore?: string;
  partner?: string;
  pricePoints?: number;
  pointsRequired?: number;
  imageUrl?: string;
}

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward | null;
  userBalance: number;
  onSuccess?: (newBalance: number) => void;
}

export default function CheckoutDrawer({
  isOpen,
  onClose,
  reward,
  userBalance,
  onSuccess,
}: CheckoutDrawerProps) {
  const [step, setStep] = useState<CheckoutStep>("confirm");
  // Protocolo = id real do resgate devolvido pelo servidor. Nunca exibir um
  // código gerado no navegador: o parceiro não o reconheceria.
  const [protocol, setProtocol] = useState<string>("");
  const [affiliateUrl, setAffiliateUrl] = useState<string>("");
  const [redeemError, setRedeemError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [lastIsOpen, setLastIsOpen] = useState(isOpen);

  const price = reward?.pointsRequired || reward?.pricePoints || 0;
  const partner = reward?.partner || reward?.partnerStore || "Parceiro";
  const title = reward?.title || "Recompensa";

  // Reset state when opening
  if (isOpen !== lastIsOpen) {
    setLastIsOpen(isOpen);
    if (isOpen) {
      setStep("confirm");
      setProtocol("");
      setAffiliateUrl("");
      setRedeemError("");
      setCopied(false);
    }
  }

  const handleRedeem = async () => {
    if (!reward?.id) return;
    setStep("loading");
    setRedeemError("");
    try {
      const response = await triggerRewardRedemption(reward.id);

      if (!response.success) {
        // Mostra o motivo real devolvido pela API (saldo, bloqueio, indisponível).
        setRedeemError(response.error || "Não foi possível concluir o resgate. Tente de novo.");
        setStep("confirm");
        return;
      }

      setProtocol(response.redemptionId ? response.redemptionId.slice(0, 8).toUpperCase() : "");
      if (response.affiliateUrl) {
        setAffiliateUrl(response.affiliateUrl);
      }

      setStep("success");

      if (onSuccess) {
        onSuccess(response.newBalance ?? (userBalance - price));
      }
    } catch (error) {
      console.error(error);
      setRedeemError("Sem conexão com o servidor. Seus pontos não foram debitados; tente de novo.");
      setStep("confirm");
    }
  };

  const copyProtocol = async () => {
    try {
      await navigator.clipboard.writeText(protocol);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  // If Drawer is closed or no reward is selected, don't render content
  if (!isOpen || !reward) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step === "loading" ? undefined : onClose}
          className="absolute inset-0 bg-brand-slate/20 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md h-full bg-md-surface shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-md-outline">
            <h2 className="text-xl font-bold text-md-on-surface">
              {step === "success" ? "Resgate Concluído" : "Confirmar Resgate"}
            </h2>
            <button
              type="button"
              aria-label="Fechar"
              onClick={onClose}
              disabled={step === "loading"}
              className="p-2 text-gray-400 hover:text-md-on-surface transition-colors disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            {/* PRODUCT SUMMARY CARD */}
            <div className="bg-md-surface-container rounded-xl p-5 mb-8 border border-md-outline flex items-center gap-4">
              {reward.imageUrl ? (
                <div className="w-16 h-16 bg-md-surface rounded-lg p-2 border border-md-outline flex-shrink-0">
                  <img
                    src={reward.imageUrl}
                    alt={title}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-md-surface rounded-lg p-2 border border-md-outline flex items-center justify-center flex-shrink-0">
                  <Coins className="text-md-tertiary" size={24} />
                </div>
              )}
              
              <div className="flex-1">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Na {partner}
                </div>
                <h3 className="font-bold text-md-on-surface leading-tight text-sm">
                  {title}
                </h3>
              </div>
            </div>

            {/* STEP: CONFIRM */}
            {step === "confirm" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-md-outline">
                    <span className="text-gray-500">Seu Saldo Atual</span>
                    <span className="font-bold text-md-tertiary">{userBalance} pts</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-md-outline">
                    <span className="text-gray-500">Valor do Resgate</span>
                    <span className="font-bold text-md-error">- {price} pts</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium text-md-on-surface">Saldo Final</span>
                    <span className="font-black text-md-tertiary text-lg">
                      {userBalance - price} pts
                    </span>
                  </div>
                </div>

                {redeemError && (
                  <p role="alert" className="text-sm text-md-error bg-md-error/10 border border-md-error/30 rounded-xl px-4 py-3">
                    {redeemError}
                  </p>
                )}

                <div className="mt-auto pt-8">
                  <button
                    type="button"
                    onClick={handleRedeem}
                    className="w-full py-4 rounded-xl font-bold text-md-on-primary shadow-lg bg-md-primary hover:bg-md-primary-container hover:shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    Confirmar Resgate
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP: LOADING (SHIMMER) */}
            {step === "loading" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center py-12 space-y-6"
              >
                <div className="relative w-20 h-20">
                  {/* Outer spinning ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-md-tertiary/20 border-t-md-tertiary animate-spin"></div>
                  {/* Inner glowing core */}
                  <div className="absolute inset-2 bg-md-primary rounded-full animate-pulse opacity-20"></div>
                  <Loader2 className="absolute inset-0 m-auto text-md-primary animate-spin" size={32} />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-md-on-surface text-lg">
                    Processando transação...
                  </h3>
                  <p className="text-gray-500 text-sm animate-pulse">
                    Comunicação segura com a API
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP: SUCCESS */}
            {step === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="flex flex-col flex-1"
              >
                <div className="flex flex-col items-center text-center mb-8 pt-4">
                  <div className="w-20 h-20 bg-md-tertiary/15 rounded-full flex items-center justify-center mb-6 text-md-tertiary">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-md-on-surface mb-2">
                    Resgate registrado
                  </h3>
                  <p className="text-md-on-surface-variant" role="status">
                    <strong className="text-md-tertiary">{price} pts</strong> foram debitados do seu saldo.
                    {affiliateUrl
                      ? ` Para usar o benefício, acesse a oferta de ${partner} pelo botão abaixo.`
                      : " Você receberá as instruções do benefício nas notificações."}
                  </p>
                </div>

                {protocol && (
                  <div className="bg-md-surface-container border border-md-outline rounded-xl p-5 text-center mb-8">
                    <p className="text-xs text-md-on-surface-variant font-bold uppercase tracking-wider mb-2">
                      Protocolo do resgate
                    </p>
                    <p className="font-mono text-xl font-black text-md-on-surface tracking-widest mb-1">
                      {protocol}
                    </p>
                    <p className="text-xs text-md-on-surface-variant mb-3">
                      Use este número se precisar falar com o RH sobre o resgate.
                    </p>
                    <button
                      type="button"
                      onClick={copyProtocol}
                      className="mx-auto h-11 flex items-center justify-center gap-2 px-4 bg-md-surface border border-md-outline rounded-lg text-sm font-medium text-md-on-surface hover:bg-md-surface-container transition-colors"
                    >
                      <Copy size={16} aria-hidden="true" /> {copied ? "Protocolo copiado" : "Copiar protocolo"}
                    </button>
                  </div>
                )}

                <div className="mt-auto flex flex-col gap-3">
                  {affiliateUrl ? (
                    <a
                      href={affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 rounded-xl font-bold text-md-on-primary shadow-md bg-md-primary hover:bg-md-primary-container transition-colors flex items-center justify-center gap-2"
                    >
                      Acessar {partner} <ExternalLink size={18} />
                    </a>
                  ) : (
                    <button
                      onClick={onClose}
                      className="w-full py-3.5 rounded-xl font-bold text-md-on-primary shadow-md bg-md-primary hover:bg-md-primary-container transition-colors flex items-center justify-center gap-2"
                    >
                      Fechar
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full py-3.5 rounded-xl font-bold text-md-primary hover:bg-md-surface-container transition-colors"
                  >
                    Voltar para o Catálogo
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
