import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { useUserContext } from "../context/UserContext";

export default function Login() {
    const navigate = useNavigate();
    const { login, loginError, loginIsLoading, currentUser } = useUserContext();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (currentUser) {
            navigate("/", { replace: true });
        }
    }, [currentUser, navigate]);

    const displayError = useMemo(() => {
        if (formError) return formError;
        if (Array.isArray(loginError)) return loginError.join(", ");
        if (typeof loginError === "object" && loginError !== null) {
            return Object.values(loginError).flat().join(", ");
        }
        return loginError;
    }, [formError, loginError]);

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setFormError(null);

        const username = formData.username.trim();
        const password = formData.password;

        if (!username || !password) {
            setFormError("Username and password are required.");
            return;
        }

        await login(username, password);
    }

    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <Card sx={{ width: "100%", maxWidth: 460 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Stack spacing={3} component="form" onSubmit={handleSubmit}>
                        <Box>
                            <Typography variant="h4" component="h1" gutterBottom>
                                Welcome back
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Log in to continue managing your spending.
                            </Typography>
                        </Box>

                        {displayError ? (
                            <Alert severity="error">{displayError}</Alert>
                        ) : null}

                        <TextField
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            autoComplete="username"
                            required
                            fullWidth
                        />

                        <TextField
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            required
                            fullWidth
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loginIsLoading}
                            fullWidth
                        >
                            {loginIsLoading ? (
                                <CircularProgress size={22} color="inherit" />
                            ) : (
                                "Log In"
                            )}
                        </Button>

                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            New here?{" "}
                            <Typography
                                component={RouterLink}
                                to="/signup"
                                variant="body2"
                                sx={{ textDecoration: "none", fontWeight: 600 }}
                            >
                                Create an account
                            </Typography>
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}