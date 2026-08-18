// lib/productStock.ts — Product inventory status badge
//
// stockStatus is optional so legacy products (created before this feature shipped)
// simply show no badge instead of a misleading default.

export type StockStatus = 'in_stock' | 'out_of_stock' | 'sold';

export interface StockBadge {
  label: string;
  color: string;
}

const STOCK_COLORS: Record<StockStatus, string> = {
  in_stock: '#2E7D32',
  out_of_stock: '#D32F2F',
  sold: '#616161',
};

/**
 * Badge to show for a product's stock status, or null when unset (legacy products,
 * or products created before this field existed).
 * `stockQty` — when set and > 0 on an in-stock product — takes priority over the
 * generic "In stock" label (e.g. "3 left" instead of just "In stock").
 */
export function getStockBadge(
  product: { stockStatus?: StockStatus | null; stockQty?: number | null },
  lang: 'fr' | 'en' = 'fr'
): StockBadge | null {
  const { stockStatus, stockQty } = product;
  if (!stockStatus) return null;

  if (stockStatus === 'in_stock' && typeof stockQty === 'number' && stockQty > 0) {
    const label = lang === 'en'
      ? `${stockQty} left`
      : `${stockQty} restant${stockQty > 1 ? 's' : ''}`;
    return { label, color: STOCK_COLORS.in_stock };
  }

  const labels: Record<StockStatus, { fr: string; en: string }> = {
    in_stock: { fr: 'En stock', en: 'In stock' },
    out_of_stock: { fr: 'Rupture de stock', en: 'Out of stock' },
    sold: { fr: 'Vendu', en: 'Sold' },
  };
  return { label: labels[stockStatus][lang], color: STOCK_COLORS[stockStatus] };
}
