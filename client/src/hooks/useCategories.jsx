import { useState } from "react";
import api from "../api/api";

export default function useCategories() {
  const [categories, setCategories] = useState([]);
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

  function parseError(err, fallback) {
    return err.response?.data?.error || err.response?.data?.errors || fallback;
  }

  function setPaginationFromResponse(data, fallbackPage, fallbackPerPage) {
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
  }

  // READ
  async function getCategories({ page = 1, perPage = 20 } = {}) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.get("/categories", {
        params: {
          page,
          per_page: perPage,
        },
      });

      const data = res.data ?? {};
      setCategories(data.categories ?? []);
      setPaginationFromResponse(data, page, perPage);
    } catch (err) {
      setError(parseError(err, "Fetch failed"));
    } finally {
      setIsLoading(false);
    }
  }

  // CREATE
  async function createCategory(data) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post("/categories", data);
      setCategories((prev) => [...prev, res.data]);
      return res.data;
    } catch (err) {
      const message = parseError(err, "Create failed");
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  // UPDATE
  async function updateCategory(id, data) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.patch(`/categories/${id}`, data);

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? res.data : c))
      );

      return res.data;
    } catch (err) {
      const message = parseError(err, "Update failed");
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  // DELETE
  async function deleteCategory(id) {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      const message = parseError(err, "Delete failed");
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    categories,
    pagination,
    isLoading,
    error,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}