import { useState, createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import useSignUp from '../hooks/auth_hooks/useSignUp';
import useLogin from '../hooks/auth_hooks/useLogin';

const UserContext = createContext(null);
const ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

export function UserProvider({ children }) {
    const { signUp, signUpError, setSignUpError, signUpIsLoading, setSignUpIsLoading, signUpUser, setSignUpUser } = useSignUp();
    const { login, loginError, setLoginError, loginIsLoading, setLoginIsLoading, loginUser, setLoginUser } = useLogin();

    const [currentUser, setCurrentUser] = useState(null);
    const [authIsLoading, setAuthIsLoading] = useState(true);

    const clearAuthState = useCallback(() => {
        localStorage.removeItem('token');
        setCurrentUser(null);
    }, []);

    const refreshAccessToken = useCallback(async () => {
        const refreshResponse = await axios.post(`${ENDPOINT}/refresh`, {}, {
            withCredentials: true,
        });

        const nextAccessToken = refreshResponse?.data?.access_token;

        if (!nextAccessToken) {
            throw new Error('No access token returned from refresh endpoint.');
        }

        localStorage.setItem('token', nextAccessToken);
        return nextAccessToken;
    }, []);

    useEffect(() => {
        async function bootstrapAuth() {
            const token = localStorage.getItem('token');

            if (!token) {
                setAuthIsLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${ENDPOINT}/me`, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setCurrentUser(response.data.user ?? null);
            } catch (error) {
                if (error?.response?.status === 401) {
                    try {
                        const newAccessToken = await refreshAccessToken();
                        const retryResponse = await axios.get(`${ENDPOINT}/me`, {
                            withCredentials: true,
                            headers: {
                                Authorization: `Bearer ${newAccessToken}`,
                            },
                        });

                        setCurrentUser(retryResponse.data.user ?? null);
                    } catch {
                        clearAuthState();
                    }
                } else {
                    clearAuthState();
                }
            } finally {
                setAuthIsLoading(false);
            }
        }

        bootstrapAuth();
    }, [clearAuthState, refreshAccessToken]);

    useEffect(() => {
        if (signUpUser) {
            setCurrentUser(signUpUser);
        }
    }, [signUpUser]);

    useEffect(() => {
        if (loginUser) {
            setCurrentUser(loginUser);
        }
    }, [loginUser]);

    const logout = useCallback(() => {
        clearAuthState();
        setSignUpUser(null);
        setLoginUser(null);
        setSignUpError(null);
        setLoginError(null);
        setSignUpIsLoading(false);
        setLoginIsLoading(false);
    }, [
        clearAuthState,
        setSignUpUser,
        setLoginUser,
        setSignUpError,
        setLoginError,
        setSignUpIsLoading,
        setLoginIsLoading,
    ]);

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