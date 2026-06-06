import { createContext, useContext, useMemo } from 'react';
import useBudgets from '../hooks/useBudgets';

const BudgetContext = createContext(null);

export function BudgetProvider({ children }) {
	const {
		budgets,
		query,
		pagination,
		isLoading,
		error,
		getBudgets,
		createBudget,
		updateBudget,
		deleteBudget,
	} = useBudgets();

	const value = useMemo(() => ({
		budgets,
		budgetQuery: query,
		pagination,
		budgetsIsLoading: isLoading,
		budgetsError: error,
		getBudgets,
		createBudget,
		updateBudget,
		deleteBudget,
	}), [
		budgets,
		query,
		pagination,
		isLoading,
		error,
		getBudgets,
		createBudget,
		updateBudget,
		deleteBudget,
	]);

	return (
		<BudgetContext.Provider value={value}>
			{children}
		</BudgetContext.Provider>
	);
}

export function useBudgetContext() {
	const context = useContext(BudgetContext);

	if (!context) {
		throw new Error("useBudgetContext must be used within BudgetProvider");
	}

	return context;
}
