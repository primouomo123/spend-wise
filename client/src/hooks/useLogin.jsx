import { useState } from "react";
import axios from "axios";

const ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

export default function useLogin() {
    const [loginError, setLoginError] = useState(null);
    const [loginIsLoading, setLoginIsLoading] = useState(false);
    const [loginUser, setLoginUser] = useState(null);

    async function login(username, password) {
        setLoginIsLoading(true);
        setLoginError(null);

        try {
            const response = await axios.post(`${ENDPOINT}/login`, {
                username,
                password,
            });

            localStorage.setItem("token", response.data.access_token);

            setLoginUser(response.data.user);
        }
        
        catch (err) {
            setLoginError(
                err.response?.data?.error ||
                err.response?.data?.errors ||
                "An error occurred during login."
            );
            setLoginUser(null);
        }
        
        finally {
            setLoginIsLoading(false);
        }
    };

    return { login, loginError, loginIsLoading, loginUser };
}