import { useCallback, useRef, useState } from "react";
import api from "../api/api";

function getCurrentPeriod() {
	const now = new Date();

	return {
		month: now.getMonth() + 1,
		year: now.getFullYear(),
	};
}

export default function useBudgets() {
	const defaultPeriod = getCurrentPeriod();

	const [budgets, setBudgets] = useState([]);

	const [query, setQuery] = useState({
		page: 1,
		perPage: 20,
		month: defaultPeriod.month,
		year: defaultPeriod.year,
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

	const getBudgets = useCallback(async (overrides = {}) => {
		const nextQuery = {
			...queryRef.current,
			...overrides,
		};

		queryRef.current = nextQuery;
		setQuery(nextQuery);
		setIsLoading(true);
		setError(null);

		try {
			const res = await api.get("/budgets", {
				params: {
					page: nextQuery.page,
					per_page: nextQuery.perPage,
					month: nextQuery.month,
					year: nextQuery.year,
				},
			});

			const data = res.data ?? {};
			setBudgets(data.budgets ?? []);
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

	const createBudget = useCallback(async (data) => {
		setIsLoading(true);
		setError(null);

		try {
			const res = await api.post("/budgets", data);
			setBudgets((prev) => [res.data, ...prev]);
			return res.data;
		} catch (err) {
			const message = parseError(err, "Create failed");
			setError(message);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [parseError]);

	const updateBudget = useCallback(async (id, data) => {
		setIsLoading(true);
		setError(null);

		try {
			const res = await api.patch(`/budgets/${id}`, data);

			setBudgets((prev) =>
				prev.map((budget) =>
					budget.id === id ? res.data : budget
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

	const deleteBudget = useCallback(async (id) => {
		setIsLoading(true);
		setError(null);

		try {
			await api.delete(`/budgets/${id}`);
			setBudgets((prev) => prev.filter((budget) => budget.id !== id));
		} catch (err) {
			const message = parseError(err, "Delete failed");
			setError(message);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [parseError]);

	return {
		budgets,
		query,
		pagination,
		isLoading,
		error,
		getBudgets,
		createBudget,
		updateBudget,
		deleteBudget,
	};
}
