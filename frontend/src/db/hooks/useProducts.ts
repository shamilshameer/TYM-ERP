import { useLiveQuery } from 'dexie-react-hooks';
import { productRepository } from '../repositories/productRepository';
import { LocalProduct } from '../db';

export const useProducts = () => {
  const products = useLiveQuery(() => productRepository.getAllActive()) ?? [];
  const isLoading = products === undefined;

  const saveProduct = async (product: Omit<LocalProduct, 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
    await productRepository.saveLocal(product);
  };

  const deleteProduct = async (id: string) => {
    await productRepository.deleteLocal(id);
  };

  const getProductById = async (id: string) => {
    return productRepository.getById(id);
  };

  return {
    products,
    isLoading,
    saveProduct,
    deleteProduct,
    getProductById,
  };
};
