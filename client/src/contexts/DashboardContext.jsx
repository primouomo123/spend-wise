import { createContext, useContext, useMemo } from 'react';
import useDashboard from '../hooks/useDashboard';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
	const {
		summary,
		query,
		isLoading,
		error,
		getSummary,
	} = useDashboard();

	const value = useMemo(() => ({
		summary,
		summaryQuery: query,
		dashboardIsLoading: isLoading,
		dashboardError: error,
		getSummary,
	}), [
		summary,
		query,
		isLoading,
		error,
		getSummary,
	]);

	return (
		<DashboardContext.Provider value={value}>
			{children}
		</DashboardContext.Provider>
	);
}

export function useDashboardContext() {
	const context = useContext(DashboardContext);

	if (!context) {
		throw new Error("useDashboardContext must be used within DashboardProvider");
	}

	return context;
}
