'use client';
import { useId, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

// MD3 Alert Dialog sobre o Dialog compartilhado (foco preso, Escape, pilha).
// O foco inicial vai para Cancelar: a ação segura é a padrão.
export function AlertDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
}: AlertDialogProps) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      role="alertdialog"
      labelledBy={titleId}
      describedBy={description ? descId : undefined}
      initialFocus={cancelRef}
      zIndexClassName="z-[130]"
      className="w-full max-w-sm bg-md-surface rounded-3xl border border-md-outline shadow-2xl p-6"
    >
      <h2 id={titleId} className="text-lg font-bold text-white">
        {title}
      </h2>
      {description && (
        <p id={descId} className="text-sm text-md-on-surface-variant mt-2">
          {description}
        </p>
      )}
      <div className="flex justify-end gap-3 mt-6">
        <Button ref={cancelRef} variant="text" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant="filled"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={destructive ? '!bg-md-error !text-md-on-error hover:!bg-md-error/80' : ''}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
