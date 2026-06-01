import { useState, createContext, useContext, useEffect, useMemo } from 'react';
import { useSignUp } from '../hooks/useSignUp';
import { useLogin } from '../hooks/useLogin';

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const { signUp, signUpError, signUpIsLoading, signUpUser } = useSignUp();
    const { login, loginError, loginIsLoading, loginUser } = useLogin();

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        if (signUpUser) return setCurrentUser(signUpUser);
        if (loginUser) return setCurrentUser(loginUser);
    }, [signUpUser, loginUser]);

    const value = {
        signUp,
        signUpError,
        signUpIsLoading,
        login,
        loginError,
        loginIsLoading,
        currentUser,
    };

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