import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import { useDashboardContext } from "../contexts/DashboardContext";

const MONTH_OPTIONS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
];

function normalizeError(error) {
    if (!error) return null;
    if (Array.isArray(error)) return error.join(", ");
    if (typeof error === "object") {
        return Object.values(error).flat().join(", ");
    }
    return error;
}

function formatUsd(value) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return "-";

    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(parsed);
}

function getStatCardTone(label) {
    if (label.toLowerCase().includes("expense")) return "error.main";
    if (label.toLowerCase().includes("income")) return "success.main";
    if (label.toLowerCase().includes("balance")) return "primary.main";
    return "text.primary";
}

function getDifferenceTone(value) {
    return Number(value) >= 0 ? "success.main" : "error.main";
}

function StatCard({ label, value, tone }) {
    return (
        <Card sx={{ flex: 1, minWidth: { xs: "100%", sm: 220 } }}>
            <CardContent>
                <Typography variant="body2" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="h5" sx={{ mt: 0.5, color: tone ?? getStatCardTone(label) }}>
                    {formatUsd(value)}
                </Typography>
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const {
        summary,
        summaryQuery,
        dashboardIsLoading,
        dashboardError,
        getSummary,
    } = useDashboardContext();

    const [filters, setFilters] = useState(() => ({
        month: summaryQuery?.month ?? new Date().getMonth() + 1,
        year: summaryQuery?.year ?? new Date().getFullYear(),
    }));
    const [actionError, setActionError] = useState(null);

    useEffect(() => {
        getSummary();
    }, [getSummary]);

    const displayError = useMemo(() => {
        return normalizeError(actionError) || normalizeError(dashboardError);
    }, [actionError, dashboardError]);

    const incomeDifference = Number(summary.transaction_total_income ?? 0) - Number(summary.budget_total_income ?? 0);
    const expenseDifference = Number(summary.budget_total_expenses ?? 0) - Number(summary.transaction_total_expenses ?? 0);
    const balanceDifference = Number(summary.transaction_balance ?? 0) - Number(summary.budget_balance ?? 0);

    const budgetVsActual = useMemo(() => {
        const actualByCategory = new Map();
        const budgetByCategory = new Map();
        const incomeCategories = new Set();

        for (const item of summary.transaction_summaries ?? []) {
            const key = item.category_name;
            const current = actualByCategory.get(key) ?? 0;
            actualByCategory.set(key, current + Number(item.total_amount ?? 0));

            if (String(item.transaction_type).toLowerCase() === "income") {
                incomeCategories.add(key);
            }
        }

        for (const item of summary.budget_summaries ?? []) {
            const key = item.category_name;
            const current = budgetByCategory.get(key) ?? 0;
            budgetByCategory.set(key, current + Number(item.budgeted_amount ?? 0));
        }

        const allCategories = new Set([
            ...actualByCategory.keys(),
            ...budgetByCategory.keys(),
        ]);

        const rows = [...allCategories]
            .map((categoryName) => {
                const budgeted = budgetByCategory.get(categoryName) ?? 0;
                const actual = actualByCategory.get(categoryName) ?? 0;
                const isIncomeCategory = incomeCategories.has(categoryName) || categoryName.toLowerCase() === "income";

                return {
                    category_name: categoryName,
                    budgeted,
                    actual,
                    difference: isIncomeCategory ? actual - budgeted : budgeted - actual,
                };
            })
            .sort((a, b) => a.category_name.localeCompare(b.category_name));

        return {
            rows,
        };
    }, [summary.budget_summaries, summary.transaction_summaries]);

    async function handleApplyFilters(event) {
        event.preventDefault();
        setActionError(null);

        const month = Number(filters.month);
        const year = Number(filters.year);

        if (!month || month < 1 || month > 12 || !year || year < 2000 || year > 2100) {
            setActionError("Please choose a valid month and year.");
            return;
        }

        try {
            await getSummary({ month, year });
        } catch {
            setActionError("Could not fetch dashboard summary.");
        }
    }

    return (
        <Stack spacing={2.5} sx={{ pb: 3 }}>
            <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                    Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Monthly snapshot of actual transactions against planned budgets.
                </Typography>
            </Box>

            {displayError ? <Alert severity="error">{displayError}</Alert> : null}

            <Card>
                <CardContent>
                    <Stack
                        component="form"
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ sm: "flex-end" }}
                        onSubmit={handleApplyFilters}
                    >
                        <TextField
                            select
                            label="Month"
                            value={filters.month}
                            onChange={(event) => setFilters((prev) => ({ ...prev, month: Number(event.target.value) }))}
                            sx={{ minWidth: 160 }}
                        >
                            {MONTH_OPTIONS.map((month) => (
                                <MenuItem key={month.value} value={month.value}>
                                    {month.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Year"
                            type="number"
                            value={filters.year}
                            onChange={(event) => setFilters((prev) => ({ ...prev, year: Number(event.target.value) }))}
                            sx={{ maxWidth: 140 }}
                            inputProps={{ min: 2000, max: 2100 }}
                        />

                        <Button type="submit" variant="outlined" disabled={dashboardIsLoading}>
                            Apply
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {dashboardIsLoading ? (
                <Card>
                    <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                            <CircularProgress />
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                        <StatCard label="Budgeted Income" value={summary.budget_total_income} />
                        <StatCard label="Budgeted Expenses" value={summary.budget_total_expenses} />
                        <StatCard label="Budgeted Balance" value={summary.budget_balance} />
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                        <StatCard label="Actual Income" value={summary.transaction_total_income} />
                        <StatCard label="Actual Expenses" value={summary.transaction_total_expenses} />
                        <StatCard label="Actual Balance" value={summary.transaction_balance} />
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                        <StatCard
                            label="Income Difference (Actual - Budgeted)"
                            value={incomeDifference}
                            tone={getDifferenceTone(incomeDifference)}
                        />
                        <StatCard
                            label="Expense Difference (Budgeted - Actual)"
                            value={expenseDifference}
                            tone={getDifferenceTone(expenseDifference)}
                        />
                        <StatCard
                            label="Balance Difference (Actual - Budgeted)"
                            value={balanceDifference}
                            tone={getDifferenceTone(balanceDifference)}
                        />
                    </Stack>

                    <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
                        <Card sx={{ flex: 1 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Transactions by Category
                                </Typography>

                                {summary.transaction_summaries.length === 0 ? (
                                    <Typography color="text.secondary">No transactions for this period.</Typography>
                                ) : (
                                    <Stack spacing={0.75}>
                                        {summary.transaction_summaries.map((item, index) => (
                                            <Box
                                                key={`${item.category_name}-${item.transaction_type}-${index}`}
                                                sx={{
                                                    border: "1px solid",
                                                    borderColor: "divider",
                                                    borderRadius: 2,
                                                    px: 1.25,
                                                    py: 1,
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    gap: 1,
                                                }}
                                            >
                                                <Box>
                                                    <Typography sx={{ textTransform: "capitalize" }}>{item.category_name}</Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                                                        {item.transaction_type}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="subtitle2">{formatUsd(item.total_amount)}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>

                        <Card sx={{ flex: 1 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Budgets by Category
                                </Typography>

                                {summary.budget_summaries.length === 0 ? (
                                    <Typography color="text.secondary">No budgets for this period.</Typography>
                                ) : (
                                    <Stack spacing={0.75}>
                                        {summary.budget_summaries.map((item, index) => (
                                            <Box
                                                key={`${item.category_name}-${index}`}
                                                sx={{
                                                    border: "1px solid",
                                                    borderColor: "divider",
                                                    borderRadius: 2,
                                                    px: 1.25,
                                                    py: 1,
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    gap: 1,
                                                }}
                                            >
                                                <Typography sx={{ textTransform: "capitalize" }}>{item.category_name}</Typography>
                                                <Typography variant="subtitle2">{formatUsd(item.budgeted_amount)}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>
                    </Stack>

                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Budget vs Actual by Category
                            </Typography>

                            {budgetVsActual.rows.length === 0 ? (
                                <Typography color="text.secondary">No budget or transaction data for this period.</Typography>
                            ) : (
                                <Stack spacing={0.75}>
                                    {budgetVsActual.rows.map((row) => (
                                        <Box
                                            key={row.category_name}
                                            sx={{
                                                border: "1px solid",
                                                borderColor: "divider",
                                                borderRadius: 2,
                                                px: 1.25,
                                                py: 1,
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                gap: 1,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <Typography sx={{ textTransform: "capitalize", minWidth: 160 }}>
                                                {row.category_name}
                                            </Typography>
                                            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 1.75 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Budget: {formatUsd(row.budgeted)}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Actual: {formatUsd(row.actual)}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ color: getDifferenceTone(row.difference), fontWeight: 600 }}
                                                >
                                                    Diff: {formatUsd(row.difference)}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </Stack>
    );
}