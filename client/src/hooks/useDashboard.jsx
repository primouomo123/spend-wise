import { useCallback, useRef, useState } from "react";
import api from "../api/api";

function getCurrentPeriod() {
	const now = new Date();

	return {
		month: now.getMonth() + 1,
		year: now.getFullYear(),
	};
}

function getInitialSummaryState() {
	return {
		transaction_summaries: [],
		transaction_total_income: "0.00",
		transaction_total_expenses: "0.00",
		transaction_balance: "0.00",
		budget_summaries: [],
		budget_total_income: "0.00",
		budget_total_expenses: "0.00",
		budget_balance: "0.00",
		budget_tracking: [],
		overspending: {
			is_any_category_overspent: false,
			overspent_category_count: 0,
			overspent_total_amount: "0.00",
			overspent_categories: [],
		},
	};
}

export default function useDashboard() {
	const defaultPeriod = getCurrentPeriod();

	const [summary, setSummary] = useState(getInitialSummaryState);
	const [query, setQuery] = useState({
		month: defaultPeriod.month,
		year: defaultPeriod.year,
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const queryRef = useRef({
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

	const getSummary = useCallback(async (overrides = {}) => {
		const nextQuery = {
			...queryRef.current,
			...overrides,
		};

		queryRef.current = nextQuery;
		setQuery(nextQuery);
		setIsLoading(true);
		setError(null);

		try {
			const res = await api.get("/summary", {
				params: {
					month: nextQuery.month,
					year: nextQuery.year,
				},
			});

			const data = res.data ?? getInitialSummaryState();
			setSummary({
				transaction_summaries: data.transaction_summaries ?? [],
				transaction_total_income: data.transaction_total_income ?? "0.00",
				transaction_total_expenses: data.transaction_total_expenses ?? "0.00",
				transaction_balance: data.transaction_balance ?? "0.00",
				budget_summaries: data.budget_summaries ?? [],
				budget_total_income: data.budget_total_income ?? "0.00",
				budget_total_expenses: data.budget_total_expenses ?? "0.00",
				budget_balance: data.budget_balance ?? "0.00",
				budget_tracking: data.budget_tracking ?? [],
				overspending: data.overspending ?? {
					is_any_category_overspent: false,
					overspent_category_count: 0,
					overspent_total_amount: "0.00",
					overspent_categories: [],
				},
			});

			return data;
		} catch (err) {
			const message = parseError(err, "Fetch failed");
			setError(message);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [parseError]);

	return {
		summary,
		query,
		isLoading,
		error,
		getSummary,
	};
}
