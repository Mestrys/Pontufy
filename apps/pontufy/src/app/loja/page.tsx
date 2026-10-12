'use client';
import { useState } from 'react';

import CategoryFilter from '@/components/marketplace/CategoryFilter';
import ProductGrid from '@/components/marketplace/ProductGrid';
import CheckoutDrawer from '@/components/marketplace/CheckoutDrawer';
import { CatalogSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useStore } from '@/store/useStore';
import { useRewards } from '@/hooks/useApi';
import { Gift, Coins, PackageOpen } from 'lucide-react';

const categories = [
  { id: 'all', name: 'Todos' },
  { id: 'coupons', name: 'Cupons de desconto' },
  { id: 'offers', name: 'Ofertas' },
  { id: 'tech', name: 'Tecnologia' },
  { id: 'health', name: 'Saúde' },
  { id: 'home', name: 'Utilidades' },
  { id: 'courses', name: 'Cursos' },
];

const PAGE_SIZE = 20;

// Única vitrine de benefícios (a antiga /rewards redireciona para cá).
export default function MarketplacePage() {
  const userPoints = useStore((s) => s.currentPointsBalance);
  const [activeCategory, setActiveCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const apiCategory = activeCategory === 'all' ? undefined : activeCategory;
  const { data: rewardsResponse, isValidating, mutate: refreshRewards } = useRewards(page, PAGE_SIZE, apiCategory);
  const products = rewardsResponse?.data || [];
  const totalPages: number = rewardsResponse?.totalPages || 0;
  // useRewards tem fallbackData vazio: "carregando" = buscando sem nada para mostrar.
  const isLoading = isValidating && products.length === 0;

  const selectCategory = (id: string) => {
    setActiveCategory(id);
    setPage(1);
  };

  const handleRedeem = (product: any) => {
    const price = product.pricePoints ?? product.pointsRequired ?? 0;
    if (userPoints >= price) {
      setSelectedProduct(product);
      setIsCheckoutOpen(true);
    }
  };

  const handleRedeemSuccess = (newBalance: number) => {
    useStore.getState().setPointsBalance(newBalance);
    refreshRewards();
  };

  return (
    <div className="min-h-screen pb-20 pt-8 bg-md-surface-dim">
      <div className="max-w-[1600px] mx-auto">
        <div className="px-4 sm:px-8 md:px-16 mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Gift size={24} className="text-md-secondary" aria-hidden="true" />
              <h1 className="text-3xl font-black text-white tracking-tight">Clube de Benefícios</h1>
            </div>
            <p className="text-md-on-surface-muted text-sm">Troque seus pontos por benefícios reais.</p>
          </div>
          <div className="flex items-center gap-3 bg-md-surface border border-md-outline rounded-xl px-5 py-3">
            <Coins size={22} className="text-md-tertiary" aria-hidden="true" />
            <div>
              <p className="text-xs text-md-on-surface-muted">Seu saldo</p>
              <p className="text-xl font-black text-md-tertiary">{userPoints.toLocaleString('pt-BR')} pts</p>
            </div>
          </div>
        </div>

        <CategoryFilter categories={categories} activeCategory={activeCategory} onSelect={selectCategory} />

        <div aria-busy={isLoading} aria-live="polite">
          {isLoading ? (
            <div className="px-4 sm:px-8 md:px-16">
              <span className="sr-only">Carregando benefícios…</span>
              <CatalogSkeleton count={8} />
            </div>
          ) : products.length === 0 ? (
            <div className="px-4 sm:px-8 md:px-16">
              <EmptyState
                icon={PackageOpen}
                title={apiCategory ? 'Nada nesta categoria por enquanto' : 'Nenhum benefício disponível'}
                description={
                  apiCategory
                    ? 'Veja todos os benefícios ou escolha outra categoria.'
                    : 'O RH ainda não liberou benefícios para a sua empresa. Continue acumulando pontos.'
                }
                actionLabel={apiCategory ? 'Ver todos os benefícios' : undefined}
                onAction={apiCategory ? () => selectCategory('all') : undefined}
              />
            </div>
          ) : (
            <ProductGrid products={products} userPoints={userPoints} onRedeem={handleRedeem} />
          )}
        </div>

        {totalPages > 1 && (
          <nav aria-label="Páginas de benefícios" className="px-4 sm:px-8 md:px-16 mt-10 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-11 px-5 rounded-full border border-md-outline text-md-on-surface-variant hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
            >
              Anterior
            </button>
            <span className="text-sm text-md-on-surface-muted">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-11 px-5 rounded-full border border-md-outline text-md-on-surface-variant hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
            >
              Próxima
            </button>
          </nav>
        )}
      </div>

      <CheckoutDrawer
        reward={selectedProduct}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        userBalance={userPoints}
        onSuccess={handleRedeemSuccess}
      />
    </div>
  );
}
