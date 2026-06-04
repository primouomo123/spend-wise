import { createContext, useContext, useMemo } from 'react';
import useTransactions from '../hooks/useTransactions';

const TransactionContext = createContext(null);

export function TransactionProvider({ children }) {
	const {
		transactions,
		query,
		pagination,
		isLoading,
		error,
		getTransactions,
		createTransaction,
		updateTransaction,
		deleteTransaction,
	} = useTransactions();

	const value = useMemo(() => ({
		transactions,
		transactionQuery: query,
		pagination,
		transactionsIsLoading: isLoading,
		transactionsError: error,
		getTransactions,
		createTransaction,
		updateTransaction,
		deleteTransaction,
	}), [
		transactions,
		query,
		pagination,
		isLoading,
		error,
		getTransactions,
		createTransaction,
		updateTransaction,
		deleteTransaction,
	]);

	return (
		<TransactionContext.Provider value={value}>
			{children}
		</TransactionContext.Provider>
	);
}

export function useTransactionContext() {
	const context = useContext(TransactionContext);

	if (!context) {
		throw new Error("useTransactionContext must be used within TransactionProvider");
	}

	return context;
}
