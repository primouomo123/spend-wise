import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { NavLink } from "react-router-dom";

import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";

import { useThemeContext } from "../contexts/ThemeContext";

export default function Header({ onLogout }) {
    const { isDarkMode, toggleTheme } = useThemeContext();

    const navLinks = [
        { to: "/", label: "Dashboard", icon: <DashboardOutlinedIcon fontSize="small" /> },
        { to: "/categories", label: "Categories", icon: <CategoryOutlinedIcon fontSize="small" /> },
        { to: "/transactions", label: "Transactions", icon: <ReceiptLongOutlinedIcon fontSize="small" /> },
        { to: "/budget", label: "Budget", icon: <AccountBalanceWalletOutlinedIcon fontSize="small" /> },
        { to: "/me", label: "Profile", icon: <PersonOutlineOutlinedIcon fontSize="small" /> },
    ];

    return (
        <Paper
            component="header"
            elevation={0}
            sx={(theme) => ({
                position: "sticky",
                top: 16,
                zIndex: 1000,

                px: { xs: 2, md: 3 },
                py: 1.2,
                mb: 4,

                borderRadius: 3,
                backdropFilter: "blur(14px)",

                backgroundColor:
                    theme.palette.mode === "dark"
                        ? "rgba(17,24,39,0.85)"
                        : "rgba(255,255,255,0.85)",

                border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            })}
        >
            {/* FLEX CONTAINER (FIXED RESPONSIVE LAYOUT) */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                }}
            >

                {/* LEFT - LOGO */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        minWidth: 180,
                        flexShrink: 0,
                    }}
                >
                    <SavingsOutlinedIcon color="primary" sx={{ fontSize: 30 }} />

                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                letterSpacing: "-0.03em",
                                lineHeight: 1.1,
                            }}
                        >
                            SpendWise
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                            Personal Finance Tracker
                        </Typography>
                    </Box>
                </Box>

                {/* CENTER - NAVIGATION */}
                <Box
                    component="nav"
                    sx={{
                        flex: 1,
                        display: "flex",
                        justifyContent: "center",
                        flexWrap: "wrap",
                        gap: 0.75,
                        minWidth: 0,
                    }}
                >
                    {navLinks.map((link) => (
                        <Box
                            key={link.to}
                            component={NavLink}
                            to={link.to}
                            sx={(theme) => ({
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,

                                textDecoration: "none",
                                px: 1.4,
                                py: 0.85,
                                borderRadius: 2,

                                color: theme.palette.text.secondary,
                                transition: "all 150ms ease",

                                "&:hover": {
                                    color: theme.palette.text.primary,
                                    backgroundColor: alpha(
                                        theme.palette.text.primary,
                                        0.05
                                    ),
                                },

                                "&.active": {
                                    color: theme.palette.primary.main,
                                    backgroundColor: alpha(
                                        theme.palette.primary.main,
                                        0.12
                                    ),
                                    border: `1px solid ${alpha(
                                        theme.palette.primary.main,
                                        0.22
                                    )}`,
                                    fontWeight: 600,
                                },
                            })}
                        >
                            {link.icon}

                            <Typography
                                variant="body2"
                                sx={{ fontWeight: "inherit" }}
                            >
                                {link.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* RIGHT - ACTIONS (ALWAYS STABLE) */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                    }}
                >
                    <IconButton onClick={toggleTheme} size="small">
                        {isDarkMode ? (
                            <LightModeOutlinedIcon />
                        ) : (
                            <DarkModeOutlinedIcon />
                        )}
                    </IconButton>

                    <Button
                        onClick={onLogout}
                        variant="outlined"
                        color="error"
                        size="small"
                        sx={{
                            textTransform: "none",
                            borderRadius: 2,
                            px: 2,
                        }}
                    >
                        Logout
                    </Button>
                </Box>

            </Box>
        </Paper>
    );
}