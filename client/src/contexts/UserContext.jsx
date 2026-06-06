import { useState, createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import useSignUp from '../hooks/auth_hooks/useSignUp';
import useLogin from '../hooks/auth_hooks/useLogin';
import api, { AUTH_LOGOUT_EVENT } from '../api/api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const { signUp, signUpError, setSignUpError, signUpIsLoading, setSignUpIsLoading, signUpUser, setSignUpUser } = useSignUp();
    const { login, loginError, setLoginError, loginIsLoading, setLoginIsLoading, loginUser, setLoginUser } = useLogin();

    const [currentUser, setCurrentUser] = useState(null);
    const [authIsLoading, setAuthIsLoading] = useState(true);

    const clearAuthState = useCallback(() => {
        localStorage.removeItem('token');
        setCurrentUser(null);
    }, []);

    const resetSessionState = useCallback(() => {
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

    useEffect(() => {
        async function bootstrapAuth() {
            const token = localStorage.getItem('token');

            if (!token) {
                setAuthIsLoading(false);
                return;
            }

            try {
                const response = await api.get('/me');
                setCurrentUser(response.data.user ?? null);
            } catch {
                clearAuthState();
            } finally {
                setAuthIsLoading(false);
            }
        }

        bootstrapAuth();
    }, [clearAuthState]);

    useEffect(() => {
        function handleAuthLogout() {
            resetSessionState();
        }

        window.addEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);

        return () => {
            window.removeEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
        };
    }, [resetSessionState]);

    const resolvedCurrentUser = loginUser ?? signUpUser ?? currentUser;

    const logout = useCallback(async () => {
        try {
            await api.post('/logout');
        } catch {
            // Always clear local auth state even if server logout fails.
        } finally {
            resetSessionState();
        }
    }, [resetSessionState]);

    const value = useMemo(() => ({
        signUp,
        signUpError,
        signUpIsLoading,
        login,
        loginError,
        loginIsLoading,
        logout,
        currentUser: resolvedCurrentUser,
        authIsLoading,
    }), [
        signUp,
        signUpError,
        signUpIsLoading,
        login,
        loginError,
        loginIsLoading,
        logout,
        resolvedCurrentUser,
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