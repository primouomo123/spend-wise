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
    Pagination,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import { useCategoryContext } from "../contexts/CategoryContext";

function normalizeError(error) {
    if (!error) return null;
    if (Array.isArray(error)) return error.join(", ");
    if (typeof error === "object") return Object.values(error).flat().join(", ");
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

export default function Categories() {
    const {
        categories,
        pagination,
        categoriesIsLoading,
        categoriesError,
        getCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    } = useCategoryContext();

    const [newCategoryName, setNewCategoryName] = useState("");
    const [actionError, setActionError] = useState(null);
    const [editTarget, setEditTarget] = useState(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        getCategories({ page: 1, perPage: 20 });
    }, [getCategories]);

    const displayError = useMemo(() => {
        if (actionError) return actionError;
        if (Array.isArray(categoriesError)) return categoriesError.join(", ");
        if (typeof categoriesError === "object" && categoriesError !== null) {
            return Object.values(categoriesError).flat().join(", ");
        }
        return categoriesError;
    }, [actionError, categoriesError]);

    async function handleCreate(event) {
        event.preventDefault();
        setActionError(null);

        const name = newCategoryName.trim();
        if (!name) {
            setActionError("Category name is required.");
            return;
        }

        try {
            await createCategory({ name });
            setNewCategoryName("");
            await getCategories({ page: pagination.page, perPage: pagination.perPage });
        } catch (err) {
            setActionError(getRequestError(err, "Could not create category."));
        }
    }

    function openEditDialog(category) {
        setEditTarget(category);
        setEditName(category.name ?? "");
        setActionError(null);
    }

    function closeEditDialog() {
        setEditTarget(null);
        setEditName("");
    }

    async function handleUpdate() {
        setActionError(null);

        if (!editTarget) return;

        const name = editName.trim();
        if (!name) {
            setActionError("Category name is required.");
            return;
        }

        try {
            await updateCategory(editTarget.id, { name });
            closeEditDialog();
            await getCategories({ page: pagination.page, perPage: pagination.perPage });
        } catch (err) {
            setActionError(getRequestError(err, "Could not update category."));
        }
    }

    async function handleDelete(categoryId) {
        setActionError(null);

        try {
            await deleteCategory(categoryId);
            await getCategories({ page: pagination.page, perPage: pagination.perPage });
        } catch (err) {
            setActionError(getRequestError(err, "Could not delete category."));
        }
    }

    async function handlePageChange(_event, page) {
        await getCategories({ page, perPage: pagination.perPage });
    }

    return (
        <Stack spacing={2.5} sx={{ pb: 3 }}>
            <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                    Categories
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Create and manage spending categories for your account.
                </Typography>
            </Box>

            {displayError ? <Alert severity="error">{displayError}</Alert> : null}

            <Card>
                <CardContent>
                    <Stack
                        component="form"
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        onSubmit={handleCreate}
                    >
                        <TextField
                            label="New Category"
                            value={newCategoryName}
                            onChange={(event) => setNewCategoryName(event.target.value)}
                            fullWidth
                        />
                        <Button type="submit" variant="contained" disabled={categoriesIsLoading}>
                            Add
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    {categoriesIsLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : categories.length === 0 ? (
                        <Typography color="text.secondary">
                            No categories yet.
                        </Typography>
                    ) : (
                        <Stack spacing={1}>
                            {categories.map((category) => (
                                <Box
                                    key={category.id}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                        px: 1.5,
                                        py: 1,
                                    }}
                                >
                                    <Typography>{category.name}</Typography>
                                    <Stack direction="row" spacing={0.5}>
                                        <IconButton
                                            size="small"
                                            onClick={() => openEditDialog(category)}
                                            aria-label={`Edit ${category.name}`}
                                        >
                                            <EditRoundedIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(category.id)}
                                            aria-label={`Delete ${category.name}`}
                                        >
                                            <DeleteOutlineRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </Card>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="body2" color="text.secondary">
                    Total categories: {pagination.total}
                </Typography>

                <Pagination
                    color="primary"
                    count={Math.max(pagination.totalPages, 1)}
                    page={pagination.page}
                    onChange={handlePageChange}
                    disabled={categoriesIsLoading || pagination.totalPages <= 1}
                />
            </Box>

            <Dialog open={Boolean(editTarget)} onClose={closeEditDialog} fullWidth maxWidth="xs">
                <DialogTitle>Edit Category</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Category Name"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        fullWidth
                        sx={{ mt: 1 }}
                    />
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