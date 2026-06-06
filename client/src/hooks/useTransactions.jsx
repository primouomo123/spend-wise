import { useCallback, useRef, useState } from "react";
import api from "../api/api";

function getCurrentPeriod() {
	const now = new Date();

	return {
		month: now.getMonth() + 1,
		year: now.getFullYear(),
	};
}

export default function useTransactions() {
	const defaultPeriod = getCurrentPeriod();

	const [transactions, setTransactions] = useState([]);

	const [query, setQuery] = useState({
		page: 1,
		perPage: 20,
		month: defaultPeriod.month,
		year: defaultPeriod.year,
		category_name: "",
	});

	const [pagination, setPagination] = useState({
		page: 1,
		perPage: 20,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false,
	});

	const [isLoading, setIsLoading] = useState(false);
    
	const [error, setError] = useState(null);

	const queryRef = useRef({
		page: 1,
		perPage: 20,
		month: defaultPeriod.month,
		year: defaultPeriod.year,
		category_name: "",
	});

	const parseError = useCallback((err, fallback) => {
		return (
			err.response?.data?.error ||
			err.response?.data?.errors ||
			err.response?.data?.details ||
			fallback
		);
	}, []);

	const setPaginationFromResponse = useCallback((data, fallbackPage, fallbackPerPage) => {
		const page = data?.page ?? fallbackPage;
		const perPage = data?.per_page ?? fallbackPerPage;
		const total = data?.total ?? 0;
		const totalPages = data?.total_pages ?? 0;

		setPagination({
			page,
			perPage,
			total,
			totalPages,
			hasNext: page < totalPages,
			hasPrev: page > 1,
		});
	}, []);

	const getTransactions = useCallback(async (overrides = {}) => {
		const nextQuery = {
			...queryRef.current,
			...overrides,
		};

		queryRef.current = nextQuery;
		setQuery(nextQuery);
		setIsLoading(true);
		setError(null);

		try {
			const res = await api.get("/transactions", {
				params: {
					page: nextQuery.page,
					per_page: nextQuery.perPage,
					month: nextQuery.month,
					year: nextQuery.year,
					category_name: nextQuery.category_name || undefined,
				},
			});

			const data = res.data ?? {};
			setTransactions(data.transactions ?? []);
			setPaginationFromResponse(data, nextQuery.page, nextQuery.perPage);
			return data;
		} catch (err) {
			const message = parseError(err, "Fetch failed");
			setError(message);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [parseError, setPaginationFromResponse]);

	const createTransaction = useCallback(async (data) => {
		setIsLoading(true);
		setError(null);

		try {
			const res = await api.post("/transactions", data);
			setTransactions((prev) => [res.data, ...prev]);
			return res.data;
		} catch (err) {
			const message = parseError(err, "Create failed");
			setError(message);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [parseError]);

	const updateTransaction = useCallback(async (id, data) => {
		setIsLoading(true);
		setError(null);

		try {
			const res = await api.patch(`/transactions/${id}`, data);

			setTransactions((prev) =>
				prev.map((transaction) =>
					transaction.id === id ? res.data : transaction
				)
			);

			return res.data;
		} catch (err) {
			const message = parseError(err, "Update failed");
			setError(message);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [parseError]);

	const deleteTransaction = useCallback(async (id) => {
		setIsLoading(true);
		setError(null);

		try {
			await api.delete(`/transactions/${id}`);
			setTransactions((prev) => prev.filter((transaction) => transaction.id !== id));
		} catch (err) {
			const message = parseError(err, "Delete failed");
			setError(message);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [parseError]);

	return {
		transactions,
		query,
		pagination,
		isLoading,
		error,
		getTransactions,
		createTransaction,
		updateTransaction,
		deleteTransaction,
	};
}
