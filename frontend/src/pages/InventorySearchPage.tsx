import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchInventory } from '../api/inventory.api';
import { SearchBar } from '../components/common/SearchBar';
import { LocationCard } from '../components/inventory/LocationCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const InventorySearchPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory-search', search],
    queryFn: () => searchInventory(search),
    enabled: search.length > 2
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Find Product</h1>
        <p className="text-slate-500">Scan barcode or enter SKU/Product Name</p>
      </div>

      <div className="mb-12">
        <SearchBar 
          onSearch={setSearch} 
          placeholder="Search Product / SKU / Barcode..." 
          className="text-xl h-16 shadow-lg rounded-xl"
        />
      </div>

      {isLoading && <LoadingSpinner />}

      {!isLoading && inventory && inventory.length === 0 && search.length > 2 && (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <p className="text-xl text-slate-500">No products found matching "{search}"</p>
        </div>
      )}

      {!isLoading && inventory && inventory.length > 0 && (
        <div className="space-y-8">
          {/* Group inventory by product */}
          {Object.entries(
            inventory.reduce((acc: any, item: any) => {
              const pId = item.productId;
              if (!acc[pId]) acc[pId] = { product: item.product, locations: [] };
              acc[pId].locations.push(item);
              return acc;
            }, {})
          ).map(([productId, group]: any) => (
            <div key={productId} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-white p-6">
                <h2 className="text-2xl font-bold">{group.product.name}</h2>
                <p className="text-slate-300 font-mono mt-1 text-lg">SKU: {group.product.sku}</p>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-slate-700 mb-4">Stock Locations ({group.locations.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.locations.map((loc: any) => (
                    <LocationCard 
                      key={loc.id} 
                      bin={loc.bin} 
                      available={loc.available} 
                      reserved={loc.reserved}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventorySearchPage;
