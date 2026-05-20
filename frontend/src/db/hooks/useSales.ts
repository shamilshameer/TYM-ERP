import { useLiveQuery } from 'dexie-react-hooks';
import { saleRepository } from '../repositories/saleRepository';
import { LocalSale, LocalSaleItem } from '../db';

export const useSales = () => {
  const sales = useLiveQuery(() => saleRepository.getAllActive()) ?? [];
  const isLoading = sales === undefined;

  const createSale = async (
    sale: Omit<LocalSale, 'createdAt' | 'updatedAt' | 'syncStatus'>,
    items: Omit<LocalSaleItem, 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus'>[]
  ) => {
    await saleRepository.createSaleLocal(sale, items);
  };

  const voidSale = async (id: string) => {
    await saleRepository.deleteSaleLocal(id);
  };

  const getSaleDetails = async (id: string) => {
    return saleRepository.getSaleWithItems(id);
  };

  return {
    sales,
    isLoading,
    createSale,
    voidSale,
    getSaleDetails,
  };
};
