import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import useTransactions from '../hooks/useTransactions';
import { useUserContext } from './UserContext';

const TransactionContext = createContext(null);
const DEFAULT_CURRENCY_OPTIONS = [{ code: 'USD', name: 'US Dollar' }];

export function TransactionProvider({ children }) {
	const [currencyOptions, setCurrencyOptions] = useState(DEFAULT_CURRENCY_OPTIONS);
	const { currentUser, authIsLoading } = useUserContext();

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

	useEffect(() => {
		let isMounted = true;

		async function loadCurrencies() {
			if (authIsLoading) return;
			if (!currentUser) {
				if (isMounted) setCurrencyOptions(DEFAULT_CURRENCY_OPTIONS);
				return;
			}

			try {
				const response = await api.get('/currencies');
				const currencies = Array.isArray(response?.data)
					? response.data
						.map((item) => {
							const code = typeof item?.iso_code === 'string' ? item.iso_code.trim().toUpperCase() : '';
							const name = typeof item?.name === 'string' ? item.name.trim() : '';

							if (!code || code.length !== 3) return null;

							return {
								code,
								name: name || code,
							};
						})
						.filter(Boolean)
					: [];

				if (!isMounted) return;

				const currencyByCode = new Map();
				currencies.forEach((currency) => {
					if (!currencyByCode.has(currency.code)) {
						currencyByCode.set(currency.code, currency);
					}
				});

				const uniqueSortedCurrencies = [...currencyByCode.values()].sort((a, b) => a.code.localeCompare(b.code));
				setCurrencyOptions(uniqueSortedCurrencies.length > 0 ? uniqueSortedCurrencies : DEFAULT_CURRENCY_OPTIONS);
			} catch {
				if (!isMounted) return;
				setCurrencyOptions(DEFAULT_CURRENCY_OPTIONS);
			}
		}

		loadCurrencies();

		return () => {
			isMounted = false;
		};
	}, [authIsLoading, currentUser]);

	const value = useMemo(() => ({
		transactions,
		currencyOptions,
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
		currencyOptions,
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
