import { createContext, useContext, useMemo } from 'react';
import useCategories from '../hooks/useCategories';

const CategoryContext = createContext(null);

export function CategoryProvider({ children }) {
    const {
        categories,
        pagination,
        isLoading,
        error,
        getCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    } = useCategories();

    const value = useMemo(() => ({
        categories,
        pagination,
        categoriesIsLoading: isLoading,
        categoriesError: error,
        getCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    }), [
        categories,
        pagination,
        isLoading,
        error,
        getCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    ]);

    return (
        <CategoryContext.Provider value={value}>
            {children}
        </CategoryContext.Provider>
    );
}

export function useCategoryContext() {
    const context = useContext(CategoryContext);

    if (!context) {
        throw new Error("useCategoryContext must be used within CategoryProvider");
    }

    return context;
}