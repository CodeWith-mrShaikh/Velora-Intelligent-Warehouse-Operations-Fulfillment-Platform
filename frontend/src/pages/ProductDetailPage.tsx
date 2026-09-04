import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProduct } from '../api/products.api';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { LocationCard } from '../components/inventory/LocationCard';
import { Package, MapPin } from 'lucide-react';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!)
  });

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!product) return <div className="p-8 text-center text-slate-500 font-bold">Product not found</div>;

  const totalStock = (product as any).totalQuantity ?? product.totalStock ?? 0;
  const price = Number((product as any).unitPrice ?? product.price ?? 0).toFixed(2);
  const inventories: any[] = (product as any).inventories || [];

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link to="/products" className="text-blue-600 hover:underline">Products</Link> / <span className="text-slate-500 font-mono font-bold">{product.sku}</span>
      </div>

      <PageHeader title={product.name} description={`Master SKU: ${product.sku}`}>
        <StatusBadge status={product.status} />
      </PageHeader>
      
      {/* Product Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold mb-1">UNIT PRICE</div>
          <div className="text-2xl font-bold text-slate-900">${price}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold mb-1">TOTAL STOCK</div>
          <div className="text-2xl font-bold text-emerald-600">{totalStock.toLocaleString()} units</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold mb-1">CATEGORY</div>
          <div className="text-lg font-bold text-slate-800">{product.category || 'General'}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold mb-1">REORDER LEVEL</div>
          <div className="text-lg font-bold text-amber-600">{product.reorderLevel} units</div>
        </div>
      </div>

      {/* Barcode & Attributes */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Package className="mr-2 text-blue-600" size={20} /> Product Attributes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-slate-500 block mb-1">Barcode (EAN-13)</span>
            <span className="font-mono font-bold text-slate-800">{product.barcode || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Description</span>
            <span className="text-slate-800">{product.description || 'No description provided'}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Storage Locations Count</span>
            <span className="font-bold text-blue-600">{inventories.length} Active Bins</span>
          </div>
        </div>
      </div>

      {/* Physical Storage Locations */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center">
            <MapPin className="mr-2 text-blue-600" size={18} /> Physical Inventory Locations
          </h3>
          <span className="text-xs font-semibold text-slate-500">{inventories.length} Locations</span>
        </div>

        {inventories.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No stock currently allocated to bins for this product.
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {inventories.map((inv: any) => (
                <LocationCard
                  key={inv.id}
                  bin={inv.bin}
                  available={inv.availableQuantity ?? inv.available ?? (inv.onHandQuantity - inv.reservedQuantity)}
                  reserved={inv.reservedQuantity ?? inv.reserved ?? 0}
                  highlightText={`TOTAL: ${inv.onHandQuantity ?? inv.quantity ?? 0} UNITS`}
                />
              ))}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Location Code</th>
                    <th className="px-4 py-3 text-left">Warehouse</th>
                    <th className="px-4 py-3 text-left">Row</th>
                    <th className="px-4 py-3 text-left">Bin</th>
                    <th className="px-4 py-3 text-right">On Hand</th>
                    <th className="px-4 py-3 text-right">Reserved</th>
                    <th className="px-4 py-3 text-right">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {inventories.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">{inv.bin?.locationCode}</td>
                      <td className="px-4 py-3 text-slate-600">{inv.bin?.row?.warehouse?.name || 'Main Warehouse'}</td>
                      <td className="px-4 py-3 text-slate-600">{inv.bin?.row?.name || inv.bin?.row?.code}</td>
                      <td className="px-4 py-3 text-slate-600">{inv.bin?.code}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{inv.onHandQuantity ?? inv.quantity ?? 0}</td>
                      <td className="px-4 py-3 text-right font-medium text-orange-600">{inv.reservedQuantity ?? inv.reserved ?? 0}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{inv.availableQuantity ?? inv.available ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
