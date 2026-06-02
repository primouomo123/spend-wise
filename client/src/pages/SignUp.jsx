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

import { useUserContext } from "../contexts/UserContext";

export default function SignUp() {
    const navigate = useNavigate();
    const { signUp, signUpError, signUpIsLoading, currentUser } = useUserContext();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (currentUser) {
            navigate("/", { replace: true });
        }
    }, [currentUser, navigate]);

    const displayError = useMemo(() => {
        if (formError) return formError;
        if (Array.isArray(signUpError)) return signUpError.join(", ");
        if (typeof signUpError === "object" && signUpError !== null) {
            return Object.values(signUpError).flat().join(", ");
        }
        return signUpError;
    }, [formError, signUpError]);

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
        const email = formData.email.trim().toLowerCase();
        const password = formData.password;
        const confirmPassword = formData.confirmPassword;

        if (!username || !email || !password || !confirmPassword) {
            setFormError("Username, email, and password are required.");
            return;
        }

        if (password.length < 8) {
            setFormError("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setFormError("Passwords do not match.");
            return;
        }

        await signUp(username, email, password);
    }

    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <Card sx={{ width: "100%", maxWidth: 460 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Stack spacing={3} component="form" onSubmit={handleSubmit}>
                        <Box>
                            <Typography variant="h4" component="h1" gutterBottom>
                                Create your account
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Start managing your spending in minutes.
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
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                            fullWidth
                        />

                        <TextField
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                            fullWidth
                            helperText="Use at least 8 characters."
                        />

                        <TextField
                            label="Confirm Password"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                            fullWidth
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={signUpIsLoading}
                            fullWidth
                        >
                            {signUpIsLoading ? (
                                <CircularProgress size={22} color="inherit" />
                            ) : (
                                "Create Account"
                            )}
                        </Button>

                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            Already have an account?{" "}
                            <Typography
                                component={RouterLink}
                                to="/login"
                                variant="body2"
                                sx={{ textDecoration: "none", fontWeight: 600 }}
                            >
                                Log in
                            </Typography>
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}