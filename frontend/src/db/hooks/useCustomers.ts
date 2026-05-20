import { useLiveQuery } from 'dexie-react-hooks';
import { customerRepository } from '../repositories/customerRepository';
import { LocalCustomer } from '../db';

export const useCustomers = () => {
  const customers = useLiveQuery(() => customerRepository.getAllActive()) ?? [];
  const isLoading = customers === undefined;

  const saveCustomer = async (customer: Omit<LocalCustomer, 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
    await customerRepository.saveLocal(customer);
  };

  const deleteCustomer = async (id: string) => {
    await customerRepository.deleteLocal(id);
  };

  const getCustomerById = async (id: string) => {
    return customerRepository.getById(id);
  };

  return {
    customers,
    isLoading,
    saveCustomer,
    deleteCustomer,
    getCustomerById,
  };
};
