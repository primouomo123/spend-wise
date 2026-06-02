import { useState } from "react";
import { ThemeProvider, CssBaseline, Container, Box } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";

import { lightTheme, darkTheme } from "../style/theme";

import Header from "../components/Header";
import { useUserContext } from "../contexts/UserContext";

export default function Home() {
    const navigate = useNavigate();
    const { logout } = useUserContext();
    const [isDarkMode, setIsDarkMode] = useState(false);

    const handleThemeToggle = () => {
        setIsDarkMode((prev) => !prev);
    };

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Container>
                <Header
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                onLogout={handleLogout} />
                <Outlet />
            </Container>
        </ThemeProvider>
    );
}