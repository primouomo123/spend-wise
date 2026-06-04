import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Pagination,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import { useBudgetContext } from "../contexts/BudgetContext";
import { useCategoryContext } from "../contexts/CategoryContext";

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

function getCurrentPeriod() {
    const now = new Date();

    return {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
    };
}

function normalizeError(error) {
    if (!error) return null;
    if (Array.isArray(error)) return error.join(", ");
    if (typeof error === "object") {
        return Object.values(error).flat().join(", ");
    }
    return error;
}

function formatAmount(value) {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return "-";

    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numeric);
}

export default function Budgets() {
    const currentPeriod = getCurrentPeriod();

    const {
        categories,
        getCategories,
        categoriesError,
    } = useCategoryContext();

    const {
        budgets,
        budgetQuery,
        pagination,
        budgetsIsLoading,
        budgetsError,
        getBudgets,
        createBudget,
        updateBudget,
        deleteBudget,
    } = useBudgetContext();

    const [queryInputs, setQueryInputs] = useState(() => ({
        month: budgetQuery?.month ?? currentPeriod.month,
        year: budgetQuery?.year ?? currentPeriod.year,
    }));

    const [createForm, setCreateForm] = useState(() => ({
        category_name: "",
        amount: "",
        month: currentPeriod.month,
        year: currentPeriod.year,
    }));

    const [editTarget, setEditTarget] = useState(null);
    const [editForm, setEditForm] = useState(() => ({
        category_name: "",
        amount: "",
        month: currentPeriod.month,
        year: currentPeriod.year,
    }));

    const [actionError, setActionError] = useState(null);

    useEffect(() => {
        getCategories({ page: 1, perPage: 100 });
        getBudgets();
    }, [getCategories, getBudgets]);

    const budgetCategories = useMemo(() => {
        const expenseCategories = categories.filter((category) => category.name !== "income");
        return expenseCategories.length > 0 ? expenseCategories : categories;
    }, [categories]);

    const displayError = useMemo(() => {
        return normalizeError(actionError) || normalizeError(budgetsError) || normalizeError(categoriesError);
    }, [actionError, budgetsError, categoriesError]);

    function validateBudgetForm(formState) {
        if (!formState.category_name) {
            return "Category is required.";
        }

        const amount = Number(formState.amount);
        if (!amount || amount <= 0) {
            return "Amount must be greater than 0.";
        }

        const month = Number(formState.month);
        if (!month || month < 1 || month > 12) {
            return "Month must be between 1 and 12.";
        }

        const year = Number(formState.year);
        if (!year || year < 2000 || year > 2100) {
            return "Year must be between 2000 and 2100.";
        }

        return null;
    }

    function buildBudgetPayload(formState) {
        return {
            category_name: formState.category_name,
            amount: formState.amount,
            month: Number(formState.month),
            year: Number(formState.year),
        };
    }

    async function handleApplyFilters(event) {
        event.preventDefault();
        setActionError(null);

        const month = Number(queryInputs.month);
        const year = Number(queryInputs.year);

        if (!month || month < 1 || month > 12 || !year || year < 2000 || year > 2100) {
            setActionError("Please choose a valid month and year.");
            return;
        }

        await getBudgets({
            page: 1,
            perPage: pagination.perPage,
            month,
            year,
        });
    }

    async function handleCreate(event) {
        event.preventDefault();
        setActionError(null);

        const validationError = validateBudgetForm(createForm);
        if (validationError) {
            setActionError(validationError);
            return;
        }

        try {
            await createBudget(buildBudgetPayload(createForm));
            setCreateForm({
                category_name: "",
                amount: "",
                month: currentPeriod.month,
                year: currentPeriod.year,
            });

            await getBudgets({
                page: 1,
                perPage: pagination.perPage,
                month: Number(queryInputs.month),
                year: Number(queryInputs.year),
            });
        } catch {
            setActionError("Could not create budget.");
        }
    }

    function openEditDialog(budget) {
        setActionError(null);
        setEditTarget(budget);
        setEditForm({
            category_name: budget.category_name ?? "",
            amount: budget.amount ?? "",
            month: budget.month ?? currentPeriod.month,
            year: budget.year ?? currentPeriod.year,
        });
    }

    function closeEditDialog() {
        setEditTarget(null);
        setEditForm({
            category_name: "",
            amount: "",
            month: currentPeriod.month,
            year: currentPeriod.year,
        });
    }

    async function handleUpdate() {
        if (!editTarget) return;

        setActionError(null);

        const validationError = validateBudgetForm(editForm);
        if (validationError) {
            setActionError(validationError);
            return;
        }

        try {
            await updateBudget(editTarget.id, buildBudgetPayload(editForm));
            closeEditDialog();

            await getBudgets({
                page: pagination.page,
                perPage: pagination.perPage,
                month: Number(queryInputs.month),
                year: Number(queryInputs.year),
            });
        } catch {
            setActionError("Could not update budget.");
        }
    }

    async function handleDelete(budgetId) {
        setActionError(null);

        try {
            await deleteBudget(budgetId);

            await getBudgets({
                page: pagination.page,
                perPage: pagination.perPage,
                month: Number(queryInputs.month),
                year: Number(queryInputs.year),
            });
        } catch {
            setActionError("Could not delete budget.");
        }
    }

    async function handlePageChange(_event, page) {
        await getBudgets({
            page,
            perPage: pagination.perPage,
            month: Number(queryInputs.month),
            year: Number(queryInputs.year),
        });
    }

    return (
        <Stack spacing={2.5} sx={{ pb: 3 }}>
            <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                    Budgets
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Set monthly budget caps by category and keep spending aligned with your plan.
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
                            value={queryInputs.month}
                            onChange={(event) => setQueryInputs((prev) => ({ ...prev, month: Number(event.target.value) }))}
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
                            value={queryInputs.year}
                            onChange={(event) => setQueryInputs((prev) => ({ ...prev, year: Number(event.target.value) }))}
                            sx={{ maxWidth: 140 }}
                            inputProps={{ min: 2000, max: 2100 }}
                        />

                        <Button type="submit" variant="outlined" disabled={budgetsIsLoading}>
                            Apply
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Stack component="form" spacing={1.5} onSubmit={handleCreate}>
                        <Typography variant="h6">Add Budget</Typography>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField
                                select
                                label="Category"
                                value={createForm.category_name}
                                onChange={(event) => setCreateForm((prev) => ({ ...prev, category_name: event.target.value }))}
                                fullWidth
                            >
                                {budgetCategories.map((category) => (
                                    <MenuItem key={category.id} value={category.name}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label="Amount"
                                type="number"
                                value={createForm.amount}
                                onChange={(event) => setCreateForm((prev) => ({ ...prev, amount: event.target.value }))}
                                fullWidth
                                inputProps={{ min: "0.01", step: "0.01" }}
                            />
                        </Stack>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField
                                select
                                label="Month"
                                value={createForm.month}
                                onChange={(event) => setCreateForm((prev) => ({ ...prev, month: Number(event.target.value) }))}
                                fullWidth
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
                                value={createForm.year}
                                onChange={(event) => setCreateForm((prev) => ({ ...prev, year: Number(event.target.value) }))}
                                fullWidth
                                inputProps={{ min: 2000, max: 2100 }}
                            />
                        </Stack>

                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button type="submit" variant="contained" disabled={budgetsIsLoading}>
                                Add Budget
                            </Button>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    {budgetsIsLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : budgets.length === 0 ? (
                        <Typography color="text.secondary">No budgets found for this period.</Typography>
                    ) : (
                        <Stack spacing={1}>
                            {budgets.map((budget) => (
                                <Box
                                    key={budget.id}
                                    sx={{
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                        px: 1.5,
                                        py: 1.25,
                                    }}
                                >
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        justifyContent="space-between"
                                        spacing={1}
                                    >
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ textTransform: "capitalize" }}>
                                                {budget.category_name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {MONTH_OPTIONS.find((m) => m.value === budget.month)?.label ?? budget.month} {budget.year}
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton
                                                size="small"
                                                onClick={() => openEditDialog(budget)}
                                                aria-label={`Edit budget ${budget.id}`}
                                            >
                                                <EditRoundedIcon fontSize="small" />
                                            </IconButton>

                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(budget.id)}
                                                aria-label={`Delete budget ${budget.id}`}
                                            >
                                                <DeleteOutlineRoundedIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Stack>

                                    <Typography variant="h6" sx={{ mt: 1 }}>
                                        {formatAmount(budget.amount)}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </Card>

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    Total budgets: {pagination.total}
                </Typography>

                <Pagination
                    color="primary"
                    count={Math.max(pagination.totalPages, 1)}
                    page={pagination.page}
                    onChange={handlePageChange}
                    disabled={budgetsIsLoading || pagination.totalPages <= 1}
                />
            </Box>

            <Dialog open={Boolean(editTarget)} onClose={closeEditDialog} fullWidth maxWidth="sm">
                <DialogTitle>Edit Budget</DialogTitle>
                <DialogContent>
                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField
                                select
                                label="Category"
                                value={editForm.category_name}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, category_name: event.target.value }))}
                                fullWidth
                            >
                                {budgetCategories.map((category) => (
                                    <MenuItem key={category.id} value={category.name}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label="Amount"
                                type="number"
                                value={editForm.amount}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, amount: event.target.value }))}
                                fullWidth
                                inputProps={{ min: "0.01", step: "0.01" }}
                            />
                        </Stack>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField
                                select
                                label="Month"
                                value={editForm.month}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, month: Number(event.target.value) }))}
                                fullWidth
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
                                value={editForm.year}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, year: Number(event.target.value) }))}
                                fullWidth
                                inputProps={{ min: 2000, max: 2100 }}
                            />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeEditDialog}>Cancel</Button>
                    <Button onClick={handleUpdate} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}