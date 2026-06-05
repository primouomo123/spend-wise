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

import { useCategoryContext } from "../contexts/CategoryContext";
import { useTransactionContext } from "../contexts/TransactionContext";

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

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "CAD", "JPY", "AUD"];

function getInitialFormData() {
    const now = new Date();
    return {
        amount: "",
        currency: "USD",
        transaction_type: "expense",
        date: now.toISOString().split("T")[0],
        description: "",
        category_name: "",
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

function getRequestError(err, fallback) {
    return (
        normalizeError(err?.response?.data?.error) ||
        normalizeError(err?.response?.data?.errors) ||
        normalizeError(err?.response?.data?.details) ||
        normalizeError(err?.message) ||
        fallback
    );
}

function formatCurrency(value, currency) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return "-";

    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(parsed);
    } catch {
        return `${parsed.toFixed(2)} ${currency}`;
    }
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString();
}

export default function Transactions() {
    const {
        categories,
        getCategories,
        categoriesError,
    } = useCategoryContext();

    const {
        transactions,
        transactionQuery,
        pagination,
        transactionsIsLoading,
        transactionsError,
        getTransactions,
        createTransaction,
        updateTransaction,
        deleteTransaction,
    } = useTransactionContext();

    const [queryInputs, setQueryInputs] = useState(() => ({
        month: transactionQuery?.month ?? new Date().getMonth() + 1,
        year: transactionQuery?.year ?? new Date().getFullYear(),
    }));
    const [createForm, setCreateForm] = useState(getInitialFormData);
    const [editTarget, setEditTarget] = useState(null);
    const [editForm, setEditForm] = useState(getInitialFormData);
    const [actionError, setActionError] = useState(null);

    useEffect(() => {
        getCategories({ page: 1, perPage: 100 });
        getTransactions();
    }, [getCategories, getTransactions]);

    const displayError = useMemo(() => {
        return normalizeError(actionError) || normalizeError(transactionsError) || normalizeError(categoriesError);
    }, [actionError, transactionsError, categoriesError]);

    const expenseCategoryOptions = useMemo(() => {
        return categories.filter((category) => category.name !== "income");
    }, [categories]);

    const currentCreateCategoryOptions =
        createForm.transaction_type === "income"
            ? [{ id: "income", name: "income" }]
            : expenseCategoryOptions;

    const currentEditCategoryOptions =
        editForm.transaction_type === "income"
            ? [{ id: "income", name: "income" }]
            : expenseCategoryOptions;

    function handleCreateFieldChange(field, value) {
        setCreateForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    function handleEditFieldChange(field, value) {
        setEditForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    function onCreateTypeChange(nextType) {
        setCreateForm((prev) => ({
            ...prev,
            transaction_type: nextType,
            category_name: nextType === "income" ? "income" : "",
        }));
    }

    function onEditTypeChange(nextType) {
        setEditForm((prev) => ({
            ...prev,
            transaction_type: nextType,
            category_name: nextType === "income" ? "income" : "",
        }));
    }

    function validateForm(formState) {
        const amount = Number(formState.amount);
        if (!amount || amount <= 0) {
            return "Amount must be greater than 0.";
        }

        if (!formState.currency) {
            return "Currency is required.";
        }

        if (!formState.date) {
            return "Date is required.";
        }

        const description = formState.description.trim();
        if (!description) {
            return "Description is required.";
        }

        if (description.length > 255) {
            return "Description must be 255 characters or fewer.";
        }

        if (formState.transaction_type === "expense" && !formState.category_name) {
            return "Category is required for expense transactions.";
        }

        return null;
    }

    function buildPayload(formState) {
        const payload = {
            amount: formState.amount,
            currency: formState.currency,
            transaction_type: formState.transaction_type,
            date: formState.date,
            description: formState.description.trim(),
        };

        if (formState.transaction_type === "expense") {
            payload.category_name = formState.category_name;
        } else {
            payload.category_name = "income";
        }

        return payload;
    }

    async function handleCreate(event) {
        event.preventDefault();
        setActionError(null);

        const validationError = validateForm(createForm);
        if (validationError) {
            setActionError(validationError);
            return;
        }

        try {
            await createTransaction(buildPayload(createForm));
            setCreateForm(getInitialFormData());
            await getTransactions({ page: 1 });
        } catch (err) {
            setActionError(getRequestError(err, "Could not create transaction."));
        }
    }

    function openEditDialog(transaction) {
        setActionError(null);
        setEditTarget(transaction);
        setEditForm({
            amount: transaction.amount ?? "",
            currency: transaction.currency ?? "USD",
            transaction_type: transaction.transaction_type ?? "expense",
            date: transaction.date ? String(transaction.date).split("T")[0] : "",
            description: transaction.description ?? "",
            category_name: transaction.category_name ?? "",
        });
    }

    function closeEditDialog() {
        setEditTarget(null);
        setEditForm(getInitialFormData());
    }

    async function handleUpdate() {
        if (!editTarget) return;

        setActionError(null);
        const validationError = validateForm(editForm);
        if (validationError) {
            setActionError(validationError);
            return;
        }

        try {
            await updateTransaction(editTarget.id, buildPayload(editForm));
            closeEditDialog();
            await getTransactions({
                page: pagination.page,
                perPage: pagination.perPage,
                month: queryInputs.month,
                year: queryInputs.year,
            });
        } catch (err) {
            setActionError(getRequestError(err, "Could not update transaction."));
        }
    }

    async function handleDelete(transactionId) {
        setActionError(null);

        try {
            await deleteTransaction(transactionId);
            await getTransactions({
                page: pagination.page,
                perPage: pagination.perPage,
                month: queryInputs.month,
                year: queryInputs.year,
            });
        } catch (err) {
            setActionError(getRequestError(err, "Could not delete transaction."));
        }
    }

    async function handlePageChange(_event, page) {
        await getTransactions({
            page,
            perPage: pagination.perPage,
            month: queryInputs.month,
            year: queryInputs.year,
        });
    }

    async function handleApplyFilters(event) {
        event.preventDefault();
        setActionError(null);

        if (!queryInputs.month || !queryInputs.year) {
            setActionError("Month and year are required.");
            return;
        }

        await getTransactions({
            page: 1,
            perPage: pagination.perPage,
            month: Number(queryInputs.month),
            year: Number(queryInputs.year),
        });
    }

    return (
        <Stack spacing={2.5} sx={{ pb: 3 }}>
            <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                    Transactions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Track your income and expenses for each month.
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

                        <Button type="submit" variant="outlined" disabled={transactionsIsLoading}>
                            Apply
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Stack component="form" spacing={1.5} onSubmit={handleCreate}>
                        <Typography variant="h6">Add Transaction</Typography>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField
                                label="Amount"
                                type="number"
                                value={createForm.amount}
                                onChange={(event) => handleCreateFieldChange("amount", event.target.value)}
                                fullWidth
                                inputProps={{ min: "0.01", step: "0.01" }}
                            />
                            <TextField
                                select
                                label="Currency"
                                value={createForm.currency}
                                onChange={(event) => handleCreateFieldChange("currency", event.target.value)}
                                fullWidth
                            >
                                {CURRENCY_OPTIONS.map((currency) => (
                                    <MenuItem key={currency} value={currency}>
                                        {currency}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                label="Type"
                                value={createForm.transaction_type}
                                onChange={(event) => onCreateTypeChange(event.target.value)}
                                fullWidth
                            >
                                <MenuItem value="expense">Expense</MenuItem>
                                <MenuItem value="income">Income</MenuItem>
                            </TextField>
                        </Stack>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField
                                label="Date"
                                type="date"
                                value={createForm.date}
                                onChange={(event) => handleCreateFieldChange("date", event.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                select
                                label="Category"
                                value={createForm.category_name}
                                onChange={(event) => handleCreateFieldChange("category_name", event.target.value)}
                                fullWidth
                                disabled={createForm.transaction_type === "income"}
                            >
                                {currentCreateCategoryOptions.map((category) => (
                                    <MenuItem key={category.id} value={category.name}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>

                        <TextField
                            label="Description"
                            value={createForm.description}
                            onChange={(event) => handleCreateFieldChange("description", event.target.value)}
                            fullWidth
                            multiline
                            minRows={2}
                        />

                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button type="submit" variant="contained" disabled={transactionsIsLoading}>
                                Add Transaction
                            </Button>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    {transactionsIsLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : transactions.length === 0 ? (
                        <Typography color="text.secondary">No transactions found for this period.</Typography>
                    ) : (
                        <Stack spacing={1}>
                            {transactions.map((transaction) => (
                                <Box
                                    key={transaction.id}
                                    sx={{
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                        p: 1.5,
                                    }}
                                >
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        justifyContent="space-between"
                                        spacing={1}
                                    >
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ textTransform: "capitalize" }}>
                                                {transaction.transaction_type}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {transaction.category_name} • {formatDate(transaction.date)}
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton
                                                size="small"
                                                onClick={() => openEditDialog(transaction)}
                                                aria-label={`Edit transaction ${transaction.id}`}
                                            >
                                                <EditRoundedIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(transaction.id)}
                                                aria-label={`Delete transaction ${transaction.id}`}
                                            >
                                                <DeleteOutlineRoundedIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Stack>

                                    <Typography variant="h6" sx={{ mt: 1 }}>
                                        {formatCurrency(transaction.amount, transaction.currency)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        USD equivalent: {formatCurrency(transaction.amount_usd, "USD")}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.75 }}>
                                        {transaction.description}
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
                    Total transactions: {pagination.total}
                </Typography>

                <Pagination
                    color="primary"
                    count={Math.max(pagination.totalPages, 1)}
                    page={pagination.page}
                    onChange={handlePageChange}
                    disabled={transactionsIsLoading || pagination.totalPages <= 1}
                />
            </Box>

            <Dialog open={Boolean(editTarget)} onClose={closeEditDialog} fullWidth maxWidth="sm">
                <DialogTitle>Edit Transaction</DialogTitle>
                <DialogContent>
                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField
                                label="Amount"
                                type="number"
                                value={editForm.amount}
                                onChange={(event) => handleEditFieldChange("amount", event.target.value)}
                                fullWidth
                                inputProps={{ min: "0.01", step: "0.01" }}
                            />

                            <TextField
                                select
                                label="Currency"
                                value={editForm.currency}
                                onChange={(event) => handleEditFieldChange("currency", event.target.value)}
                                fullWidth
                            >
                                {CURRENCY_OPTIONS.map((currency) => (
                                    <MenuItem key={currency} value={currency}>
                                        {currency}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                label="Type"
                                value={editForm.transaction_type}
                                onChange={(event) => onEditTypeChange(event.target.value)}
                                fullWidth
                            >
                                <MenuItem value="expense">Expense</MenuItem>
                                <MenuItem value="income">Income</MenuItem>
                            </TextField>
                        </Stack>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField
                                label="Date"
                                type="date"
                                value={editForm.date}
                                onChange={(event) => handleEditFieldChange("date", event.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                select
                                label="Category"
                                value={editForm.category_name}
                                onChange={(event) => handleEditFieldChange("category_name", event.target.value)}
                                fullWidth
                                disabled={editForm.transaction_type === "income"}
                            >
                                {currentEditCategoryOptions.map((category) => (
                                    <MenuItem key={category.id} value={category.name}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>

                        <TextField
                            label="Description"
                            value={editForm.description}
                            onChange={(event) => handleEditFieldChange("description", event.target.value)}
                            fullWidth
                            multiline
                            minRows={2}
                        />
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