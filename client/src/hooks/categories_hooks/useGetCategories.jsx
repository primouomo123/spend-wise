import { useState } from "react";
import api from "../../api/api";

export default function useGetCategories() {
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState(null);
  const [categoriesIsLoading, setCategoriesIsLoading] = useState(false);

  async function getCategories() {
    setCategoriesIsLoading(true);
    setCategoriesError(null);

    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (err) {
      setCategoriesError(
        err.response?.data?.error ||
        err.response?.data?.errors ||
        "An error occurred while fetching categories."
      );
    } finally {
      setCategoriesIsLoading(false);
    }
  }

  return { categories, categoriesError, categoriesIsLoading, getCategories };
}