'use client';
import { useEffect, type RefObject } from 'react';

/**
 * Menu suspenso (não modal): Escape fecha e devolve o foco ao botão que o
 * abriu; clicar fora ou levar o foco para fora (Tab) também fecha. Não prende
 * o foco — isso é papel do Dialog.
 */
export function useDismissableMenu(
  open: boolean,
  close: () => void,
  containerRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      close();
      triggerRef.current?.focus();
    };
    const onPointer = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close();
    };
    const onFocusIn = (e: FocusEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open, close, containerRef, triggerRef]);
}
