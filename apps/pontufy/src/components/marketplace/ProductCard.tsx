import { Coins, CheckCircle2, Lock } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    imageUrl?: string;
    partner?: string;
    partnerStore?: string;
    pointsRequired?: number;
    pricePoints?: number;
  };
  userPoints: number;
  onRedeem: (product: any) => void;
}

export default function ProductCard({ product, userPoints, onRedeem }: ProductCardProps) {
  const price = product.pricePoints ?? product.pointsRequired ?? 0;
  const partner = product.partnerStore ?? product.partner ?? 'Parceiro';
  const canRedeem = userPoints >= price;
  const progress = Math.min((userPoints / price) * 100, 100);
  const pointsMissing = price - userPoints;

  return (
    <div className="bg-md-surface border border-md-outline rounded-xl overflow-hidden flex flex-col hover:border-md-primary/40 transition-all duration-200 group">
      {/* Product Image */}
      <div className="relative h-44 bg-md-surface-dim flex items-center justify-center p-4">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-md-on-surface/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-md-surface uppercase tracking-wider">
          {partner}
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-white text-sm leading-snug mb-3 flex-1 line-clamp-2">
          {product.title}
        </h3>

        <div className="flex items-center gap-1.5 text-md-tertiary font-black text-base mb-4">
          <Coins size={16} />
          {price.toLocaleString('pt-BR')} pts
        </div>

        {canRedeem ? (
          <button
            onClick={() => onRedeem(product)}
            className="w-full bg-md-primary hover:bg-md-primary-container text-md-on-primary font-bold py-2.5 rounded-full transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <CheckCircle2 size={16} /> Resgatar
          </button>
        ) : (
          <div className="w-full flex flex-col gap-2">
            <button
              disabled
              className="w-full bg-md-surface-container text-gray-600 font-bold py-2.5 rounded-lg cursor-not-allowed flex items-center justify-center gap-2 text-sm border border-md-outline"
            >
              <Lock size={14} /> Resgatar
            </button>
            <div className="flex flex-col gap-1">
              <div className="w-full h-1 bg-md-outline rounded-full overflow-hidden">
                <div
                  className="h-full bg-md-tertiary rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-600 font-semibold text-center">
                Faltam {pointsMissing.toLocaleString('pt-BR')} pts
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
