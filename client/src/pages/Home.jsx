import { useState } from "react";
import { ThemeProvider, CssBaseline, Container, Box } from "@mui/material";
import { Outlet } from "react-router-dom";

import { lightTheme, darkTheme } from "../style/theme";

import Header from "../components/Header";

export default function Home() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const handleThemeToggle = () => {
        setIsDarkMode((prev) => !prev);
    };

    return (
        <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Container>
                <Header
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle} />
                <Outlet />
            </Container>
        </ThemeProvider>
    );
}