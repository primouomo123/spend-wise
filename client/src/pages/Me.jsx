import { useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Stack,
    Typography,
} from "@mui/material";

import { useUserContext } from "../contexts/UserContext";

function DetailRow({ label, value }) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                px: 1.5,
                py: 1,
            }}
        >
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body1" sx={{ textAlign: "right", wordBreak: "break-word" }}>
                {value || "-"}
            </Typography>
        </Box>
    );
}

export default function Me() {
    const navigate = useNavigate();
    const { currentUser, authIsLoading, logout } = useUserContext();

    function handleLogout() {
        logout();
        navigate("/login", { replace: true });
    }

    if (authIsLoading) {
        return (
            <Card>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (!currentUser) {
        return (
            <Stack spacing={2.5} sx={{ pb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Me
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Account details.
                    </Typography>
                </Box>

                <Alert severity="warning">No active user session was found.</Alert>

                <Box>
                    <Button variant="contained" onClick={() => navigate("/login")}>
                        Go to Login
                    </Button>
                </Box>
            </Stack>
        );
    }

    return (
        <Stack spacing={2.5} sx={{ pb: 3 }}>
            <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                    Profile
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Review your profile details.
                </Typography>
            </Box>

            <Card>
                <CardContent>
                    <Stack spacing={1.25}>
                        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                            <Typography variant="h6">Profile</Typography>
                        </Stack>

                        <DetailRow label="Username" value={currentUser.username} />
                        <DetailRow label="Email" value={currentUser.email} />
                    </Stack>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }}>
                        <Box>
                            <Typography variant="subtitle1">Sign Out</Typography>
                            <Typography variant="body2" color="text.secondary">
                                End your current session on this browser.
                            </Typography>
                        </Box>

                        <Button variant="outlined" color="error" onClick={handleLogout}>
                            Logout
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}