import { useState } from "react";
import { Container, Box } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";

import Header from "../components/Header";
import { useUserContext } from "../contexts/UserContext";

export default function Home() {
    const navigate = useNavigate();
    const { logout } = useUserContext();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
            }}
        >
            <Container
                maxWidth="lg"
                sx={{
                    py: 3,
                    px: { xs: 2, md: 3 },
                }}
            >
                <Header onLogout={handleLogout} />
                <Outlet />
            </Container>
        </Box>
    );
}