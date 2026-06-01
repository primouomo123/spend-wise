import { useState, createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import useSignUp from '../hooks/useSignUp';
import useLogin from '../hooks/useLogin';

const UserContext = createContext(null);
const ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

export function UserProvider({ children }) {
    const { signUp, signUpError, signUpIsLoading, signUpUser } = useSignUp();
    const { login, loginError, loginIsLoading, loginUser } = useLogin();

    const [currentUser, setCurrentUser] = useState(null);
    const [authIsLoading, setAuthIsLoading] = useState(true);

    useEffect(() => {
        async function bootstrapAuth() {
            const token = localStorage.getItem('token');

            if (!token) {
                setAuthIsLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${ENDPOINT}/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setCurrentUser(response.data.user ?? null);
            } catch {
                localStorage.removeItem('token');
                setCurrentUser(null);
            } finally {
                setAuthIsLoading(false);
            }
        }

        bootstrapAuth();
    }, []);

    useEffect(() => {
        if (signUpUser) return setCurrentUser(signUpUser);
        if (loginUser) return setCurrentUser(loginUser);
    }, [signUpUser, loginUser]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setCurrentUser(null);
    }, []);

    const value = useMemo(() => ({
        signUp,
        signUpError,
        signUpIsLoading,
        login,
        loginError,
        loginIsLoading,
        logout,
        currentUser,
        authIsLoading,
    }), [
        signUp,
        signUpError,
        signUpIsLoading,
        login,
        loginError,
        loginIsLoading,
        logout,
        currentUser,
        authIsLoading,
    ]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext() {
    const context = useContext(UserContext);

    if (!context) {
        throw new Error("useUserContext must be used within UserProvider");
    }

    return context;
}