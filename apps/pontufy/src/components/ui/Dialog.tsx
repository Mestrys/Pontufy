'use client';
import { useEffect, useRef, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Diálogo modal único da aplicação (quiz, checkout, notificações, menus
// laterais, celebrações, confirmações). Garante o contrato de modal:
// - role="dialog"/"alertdialog" + aria-modal + nome acessível;
// - foco entra no diálogo, fica preso nele (Tab/Shift+Tab e focusin) e volta
//   ao elemento que o abriu ao fechar;
// - Escape e clique no fundo pedem para fechar via onClose — quem usa decide
//   (ex.: confirmar antes de descartar respostas, ou ignorar durante um envio);
// - pilha: com um diálogo sobre outro, só o do topo responde a Tab/Escape;
// - rolagem da página travada enquanto houver diálogo aberto.

type Variant = 'center' | 'right' | 'left';

interface DialogProps {
  open: boolean;
  /** Pedido de fechamento (Escape, fundo, botão fechar). */
  onClose: () => void;
  children: ReactNode;
  /** id do título visível do diálogo. Use isto ou ariaLabel. */
  labelledBy?: string;
  ariaLabel?: string;
  describedBy?: string;
  role?: 'dialog' | 'alertdialog';
  variant?: Variant;
  /** false: Escape e clique no fundo não fazem nada (ex.: envio em andamento). */
  dismissible?: boolean;
  initialFocus?: RefObject<HTMLElement | null>;
  /** Para onde levar o foco ao fechar se quem abriu já saiu da tela. */
  returnFocus?: () => HTMLElement | null | undefined;
  className?: string;
  backdropClassName?: string;
  zIndexClassName?: string;
}

const TABBABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) => el.getClientRects().length > 0 && !el.closest('[inert]'),
  );
}

// Pilha global de diálogos abertos (o último é o do topo).
const stack: symbol[] = [];
let scrollLocks = 0;
let previousOverflow = '';

const noopSubscribe = () => () => {};

/**
 * Comportamento de modal para um painel já existente: foco inicial, foco
 * preso, Escape, pilha, trava de rolagem e foco devolvido ao fechar. O
 * Dialog usa este hook; painéis que só são modais em parte do tempo (a gaveta
 * do painel de RH no celular) usam direto.
 */
export function useModalBehavior({
  open,
  panelRef,
  onClose,
  dismissible = true,
  initialFocus,
  returnFocus,
}: {
  open: boolean;
  panelRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  dismissible?: boolean;
  initialFocus?: RefObject<HTMLElement | null>;
  returnFocus?: () => HTMLElement | null | undefined;
}) {
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  const returnFocusRef = useRef(returnFocus);
  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
    returnFocusRef.current = returnFocus;
  });

  useEffect(() => {
    if (!open) return;
    const id = Symbol('dialog');
    stack.push(id);
    const isTop = () => stack[stack.length - 1] === id;
    const opener = document.activeElement as HTMLElement | null;

    if (scrollLocks++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    // Foco inicial depois do primeiro paint do painel.
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const target = initialFocus?.current ?? tabbables(panel)[0] ?? panel;
      target.focus({ preventScroll: true });
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isTop()) return;
      const panel = panelRef.current;
      if (!panel) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (dismissibleRef.current) onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = tabbables(panel);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    // Rede de segurança: se o foco escapar (clique programático, portal de
    // terceiros), devolve ao diálogo do topo.
    const onFocusIn = (e: FocusEvent) => {
      if (!isTop()) return;
      const panel = panelRef.current;
      const target = e.target as Node | null;
      if (!panel || !target || panel.contains(target)) return;
      if ((target as Element).closest?.('nextjs-portal')) return;
      (tabbables(panel)[0] ?? panel).focus({ preventScroll: true });
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
      const idx = stack.indexOf(id);
      if (idx >= 0) stack.splice(idx, 1);
      if (--scrollLocks === 0) document.body.style.overflow = previousOverflow;
      // Devolve o foco a quem abriu; se ele saiu da tela, ao destino indicado
      // ou ao conteúdo principal.
      const fallback = returnFocusRef.current?.() ?? document.querySelector<HTMLElement>('main') ?? document.body;
      const back = opener && opener.isConnected && opener !== document.body ? opener : fallback;
      if (back === fallback && !fallback.hasAttribute('tabindex')) fallback.setAttribute('tabindex', '-1');
      back.focus({ preventScroll: true });
    };
  }, [open, initialFocus, panelRef]);
}

export function Dialog({
  open,
  onClose,
  children,
  labelledBy,
  ariaLabel,
  describedBy,
  role = 'dialog',
  variant = 'center',
  dismissible = true,
  initialFocus,
  returnFocus,
  className = '',
  backdropClassName = 'bg-black/60 backdrop-blur-sm',
  zIndexClassName = 'z-[100]',
}: DialogProps) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  });

  useModalBehavior({ open, panelRef, onClose, dismissible, initialFocus, returnFocus });

  if (!mounted) return null;

  const layout =
    variant === 'right' ? 'justify-end' : variant === 'left' ? 'justify-start' : 'items-center justify-center p-4';
  const offscreen = variant === 'right' ? { x: '100%' } : variant === 'left' ? { x: '-100%' } : { opacity: 0, scale: 0.96, y: 8 };
  const onscreen = variant === 'center' ? { opacity: 1, scale: 1, y: 0 } : { x: 0 };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 ${zIndexClassName} flex ${layout}`}>
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={() => {
              if (dismissibleRef.current) onCloseRef.current();
            }}
            className={`absolute inset-0 ${backdropClassName}`}
          />
          <motion.div
            ref={panelRef}
            role={role}
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-label={labelledBy ? undefined : ariaLabel}
            aria-describedby={describedBy}
            tabIndex={-1}
            initial={reduceMotion ? { opacity: 0 } : offscreen}
            animate={reduceMotion ? { opacity: 1 } : onscreen}
            exit={reduceMotion ? { opacity: 0 } : offscreen}
            transition={reduceMotion ? { duration: 0.01 } : { type: 'spring', damping: 30, stiffness: 320 }}
            className={`relative outline-none ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
