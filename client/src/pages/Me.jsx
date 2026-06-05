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

const PAGE_MAX_WIDTH = 720;

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
    const { currentUser, authIsLoading } = useUserContext();

    if (authIsLoading) {
        return (
            <Card sx={{ width: "100%", maxWidth: PAGE_MAX_WIDTH, mx: "auto", borderRadius: 3 }}>
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
            <Stack spacing={3} sx={{ pb: 4, width: "100%", maxWidth: PAGE_MAX_WIDTH, mx: "auto" }}>
                <Box>
                    <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                        Me
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
                        Account details.
                    </Typography>
                </Box>

                <Alert severity="warning" sx={{ width: "100%" }}>
                    No active user session was found.
                </Alert>

                <Box>
                    <Button variant="contained" onClick={() => navigate("/login")}>
                        Go to Login
                    </Button>
                </Box>
            </Stack>
        );
    }

    return (
        <Stack spacing={3} sx={{ pb: 4, width: "100%", maxWidth: PAGE_MAX_WIDTH, mx: "auto" }}>
            <Box>
                <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                    {currentUser.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
                    Review your profile details.
                </Typography>
            </Box>

            <Card sx={{ width: "100%", borderRadius: 3 }}>
                <CardContent>
                    <Stack spacing={1.25}>
                        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                            <Typography variant="h6" fontWeight={700}>Profile</Typography>
                        </Stack>

                        <DetailRow label="Username" value={currentUser.username} />
                        <DetailRow label="Email" value={currentUser.email} />
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}