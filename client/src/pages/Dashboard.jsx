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

/* ---------------- UTILITIES ---------------- */

function formatUsd(value) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return "-";

    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
    }).format(parsed);
}

function getDifferenceTone(value) {
    return Number(value) >= 0 ? "success.main" : "error.main";
}

/* ---------------- STAT CARD ---------------- */

function StatCard({ label, value, tone }) {
    return (
        <Card
            sx={(theme) => ({
                flex: 1,
                minWidth: { xs: "100%", sm: 220 },
                borderRadius: 3,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                border: `1px solid ${theme.palette.divider}`,
                transition: "all 150ms ease",

                "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                },
            })}
        >
            <CardContent>
                <Typography variant="body2" color="text.secondary">
                    {label}
                </Typography>

                <Typography
                    variant="h5"
                    sx={{
                        mt: 0.5,
                        fontWeight: 700,
                        color: tone ?? "text.primary",
                    }}
                >
                    {formatUsd(value)}
                </Typography>
            </CardContent>
        </Card>
    );
}

/* ---------------- DASHBOARD ---------------- */

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

    useEffect(() => {
        getSummary();
    }, [getSummary]);

    const incomeDifference =
        Number(summary.transaction_total_income ?? 0) -
        Number(summary.budget_total_income ?? 0);

    const expenseDifference =
        Number(summary.budget_total_expenses ?? 0) -
        Number(summary.transaction_total_expenses ?? 0);

    const balanceDifference =
        Number(summary.transaction_balance ?? 0) -
        Number(summary.budget_balance ?? 0);

    const transactionSummaries = useMemo(
        () => summary.transaction_summaries ?? [],
        [summary.transaction_summaries]
    );
    const budgetSummaries = useMemo(
        () => summary.budget_summaries ?? [],
        [summary.budget_summaries]
    );
    const budgetTracking = useMemo(
        () => summary.budget_tracking ?? [],
        [summary.budget_tracking]
    );
    const overspending = summary.overspending ?? {
        is_any_category_overspent: false,
        overspent_category_count: 0,
        overspent_total_amount: "0.00",
        overspent_categories: [],
    };

    /* ---------------- LOADING ---------------- */

    if (dashboardIsLoading) {
        return (
            <Card>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                        <CircularProgress />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Stack spacing={3} sx={{ pb: 3 }}>

            {/* HEADER */}
            <Box>
                <Typography variant="h4" fontWeight={700}>
                    Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Monthly financial overview of income, expenses, and budgets.
                </Typography>
            </Box>

            {/* ERROR */}
            {dashboardError && (
                <Alert severity="error">{dashboardError}</Alert>
            )}

            {/* FILTERS (FIXED: NO MORE FULL WIDTH STRETCH) */}
            <Card
                sx={{
                    width: "fit-content",
                    maxWidth: "100%",
                    mx: "auto",
                    alignSelf: "center",
                }}
            >
                <CardContent
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        width: "fit-content",
                    }}
                >
                    <Box
                        component="form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            getSummary(filters);
                        }}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,

                            width: "fit-content",
                            flexWrap: "wrap",
                        }}
                    >
                        <TextField
                            select
                            size="small"
                            label="Month"
                            value={filters.month}
                            onChange={(e) =>
                                setFilters((p) => ({
                                    ...p,
                                    month: Number(e.target.value),
                                }))
                            }
                            sx={{ width: 140 }}
                        >
                            {Array.from({ length: 12 }).map((_, i) => (
                                <MenuItem key={i} value={i + 1}>
                                    {new Date(0, i).toLocaleString("default", {
                                        month: "short",
                                    })}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            size="small"
                            label="Year"
                            type="number"
                            value={filters.year}
                            onChange={(e) =>
                                setFilters((p) => ({
                                    ...p,
                                    year: Number(e.target.value),
                                }))
                            }
                            sx={{ width: 110 }}
                            inputProps={{
                                min: 2000,
                                max: 2100,
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            size="small"
                            sx={{
                                height: 40,
                                px: 2,
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                            }}
                        >
                            Apply
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* KPI SECTION */}
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Typography variant="h6" fontWeight={700}>
                            Summary
                        </Typography>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                            <StatCard label="Budgeted Income" value={summary.budget_total_income} />
                            <StatCard label="Budgeted Expenses" value={summary.budget_total_expenses} />
                            <StatCard label="Budgeted Balance" value={summary.budget_balance} />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                            <StatCard label="Actual Income" value={summary.transaction_total_income} />
                            <StatCard label="Actual Expenses" value={summary.transaction_total_expenses} />
                            <StatCard label="Actual Balance" value={summary.transaction_balance} />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                            <StatCard
                                label="Income Difference"
                                value={incomeDifference}
                                tone={getDifferenceTone(incomeDifference)}
                            />
                            <StatCard
                                label="Expense Difference"
                                value={expenseDifference}
                                tone={getDifferenceTone(expenseDifference)}
                            />
                            <StatCard
                                label="Balance Difference"
                                value={balanceDifference}
                                tone={getDifferenceTone(balanceDifference)}
                            />
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Typography variant="h6" fontWeight={700}>
                        Overspending
                    </Typography>

                    {overspending.is_any_category_overspent ? (
                        <Stack spacing={1} sx={{ mt: 1 }}>
                            <Typography color="error.main" fontWeight={700}>
                                Overspent Total: {formatUsd(overspending.overspent_total_amount)}
                            </Typography>
                            {overspending.overspent_categories.map((item) => (
                                <Box
                                    key={item.category_name}
                                    sx={{
                                        p: 1.2,
                                        borderRadius: 2,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Typography>{item.category_name}</Typography>
                                    <Typography fontWeight={600} color="error.main">
                                        {formatUsd(item.overspent_amount)}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    ) : (
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            No categories are overspent for this period.
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {/* DETAILS */}
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>

                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={700}>
                            Transactions by Category
                        </Typography>

                        {transactionSummaries.length === 0 ? (
                            <Typography color="text.secondary" sx={{ mt: 1 }}>
                                No transactions found for this period.
                            </Typography>
                        ) : (
                            <Stack spacing={1}>
                                {transactionSummaries.map((item, i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            p: 1.2,
                                            borderRadius: 2,
                                            display: "flex",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Typography>{item.category_name}</Typography>
                                        <Typography fontWeight={600}>
                                            {formatUsd(item.total_amount)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </CardContent>
                </Card>

                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={700}>
                            Budgets by Category
                        </Typography>

                        {budgetSummaries.length === 0 ? (
                            <Typography color="text.secondary" sx={{ mt: 1 }}>
                                No budgets found for this period.
                            </Typography>
                        ) : (
                            <Stack spacing={1}>
                                {budgetSummaries.map((item, i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            p: 1.2,
                                            borderRadius: 2,
                                            display: "flex",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Typography>{item.category_name}</Typography>
                                        <Typography fontWeight={600}>
                                            {formatUsd(item.budgeted_amount)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </CardContent>
                </Card>
            </Stack>

            {/* BUDGET VS ACTUAL */}
            <Card>
                <CardContent>
                    <Typography variant="h6" fontWeight={700}>
                        Budget vs Actual
                    </Typography>

                    {budgetTracking.length === 0 ? (
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            No transactions or budgets found for this period.
                        </Typography>
                    ) : (
                        <Stack spacing={1}>
                            {budgetTracking.map((row) => (
                                <Box
                                    key={`${row.category_name}-${row.transaction_type}`}
                                    sx={{
                                        p: 1.2,
                                        borderRadius: 2,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Typography sx={{ minWidth: 160 }}>
                                        {row.category_name}
                                    </Typography>

                                    <Typography>
                                        Budget: {formatUsd(row.budgeted_amount)}
                                    </Typography>

                                    <Typography>
                                        Actual: {formatUsd(row.actual_amount)}
                                    </Typography>

                                    <Typography sx={{ color: getDifferenceTone(row.difference), fontWeight: 600 }}>
                                        Diff: {formatUsd(row.difference)}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </Card>

        </Stack>
    );
}