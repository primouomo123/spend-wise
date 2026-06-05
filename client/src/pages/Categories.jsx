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
    Paper,
    Divider,
} from "@mui/material";

import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import { useCategoryContext } from "../contexts/CategoryContext";

/* ---------------- ERROR HELPERS ---------------- */

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

/* ---------------- PAGE ---------------- */

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

    const visibleCategories = useMemo(() => {
        return categories.filter((category) => String(category.name).toLowerCase() !== "income");
    }, [categories]);

    /* ---------------- CREATE ---------------- */

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
            await getCategories({
                page: pagination.page,
                perPage: pagination.perPage,
            });
        } catch (err) {
            setActionError(getRequestError(err, "Could not create category."));
        }
    }

    /* ---------------- EDIT ---------------- */

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
            await getCategories({
                page: pagination.page,
                perPage: pagination.perPage,
            });
        } catch (err) {
            setActionError(getRequestError(err, "Could not update category."));
        }
    }

    /* ---------------- DELETE ---------------- */

    async function handleDelete(categoryId) {
        setActionError(null);

        try {
            await deleteCategory(categoryId);
            await getCategories({
                page: pagination.page,
                perPage: pagination.perPage,
            });
        } catch (err) {
            setActionError(getRequestError(err, "Could not delete category."));
        }
    }

    async function handlePageChange(_event, page) {
        await getCategories({ page, perPage: pagination.perPage });
    }

    /* ---------------- LOADING ---------------- */

    if (categoriesIsLoading) {
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

    /* ---------------- UI ---------------- */

    return (
        <Stack spacing={3} sx={{ pb: 4 }}>

            {/* HEADER */}
            <Box>
                <Typography variant="h4" fontWeight={700}>
                    Categories
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Create and manage spending categories.
                </Typography>
            </Box>

            {/* ERROR */}
            {displayError && <Alert severity="error">{displayError}</Alert>}

            {/* CREATE FORM (CENTERED + NOT TOO WIDE) */}
            <Card
                sx={{
                    width: "fit-content",
                    maxWidth: "100%",
                    mx: "auto",
                    alignSelf: "center",
                }}
            >
                <CardContent>
                    <Box
                        component="form"
                        onSubmit={handleCreate}
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            width: "fit-content",
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.2}
                            sx={{
                                width: { xs: "100%", sm: "fit-content" },
                                minWidth: { sm: 460 },
                            }}
                        >
                            <TextField
                                label="New category"
                                value={newCategoryName}
                                onChange={(e) =>
                                    setNewCategoryName(e.target.value)
                                }
                                size="small"
                                fullWidth
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                sx={{
                                    textTransform: "none",
                                    px: 3,
                                    borderRadius: 2,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Add
                            </Button>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>

            {/* LIST */}
            <Card
                sx={{
                    width: "100%",
                    maxWidth: 760,
                    mx: "auto",
                    alignSelf: "center",
                }}
            >
                <CardContent>
                    <Stack spacing={1}>
                        {visibleCategories.length === 0 ? (
                            <Typography color="text.secondary">
                                No categories yet.
                            </Typography>
                        ) : (
                            visibleCategories.map((category, index) => (
                                <Box key={category.id}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            py: 1.2,
                                            px: 1,
                                            borderRadius: 2,
                                            transition: "all 150ms ease",

                                            "&:hover": {
                                                backgroundColor: "action.hover",
                                            },
                                        }}
                                    >
                                        <Typography fontWeight={500}>
                                            {category.name}
                                        </Typography>

                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    openEditDialog(category)
                                                }
                                            >
                                                <EditRoundedIcon fontSize="small" />
                                            </IconButton>

                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() =>
                                                    handleDelete(category.id)
                                                }
                                            >
                                                <DeleteOutlineRoundedIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Box>

                                    {index !== visibleCategories.length - 1 && (
                                        <Divider />
                                    )}
                                </Box>
                            ))
                        )}
                    </Stack>
                </CardContent>
            </Card>

            {/* PAGINATION */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    Total: {visibleCategories.length}
                </Typography>

                <Pagination
                    page={pagination.page}
                    count={Math.max(pagination.totalPages, 1)}
                    onChange={handlePageChange}
                    color="primary"
                    disabled={
                        categoriesIsLoading || pagination.totalPages <= 1
                    }
                />
            </Box>

            {/* EDIT DIALOG */}
            <Dialog
                open={Boolean(editTarget)}
                onClose={closeEditDialog}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Edit category</DialogTitle>

                <DialogContent>
                    <TextField
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        label="Name"
                        fullWidth
                        size="small"
                        sx={{ mt: 1 }}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={closeEditDialog}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdate}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}