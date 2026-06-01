import { createTheme } from "@mui/material/styles";

const sharedTheme = {
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: `'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif`,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body2: { lineHeight: 1.5 },
  },
};

export const lightTheme = createTheme({
  ...sharedTheme,
  palette: {
    mode: "light",

    primary: {
      main: "#2563eb", // cleaner blue (finance vibe)
    },

    secondary: {
      main: "#10b981", // green = money/positive
    },

    background: {
      default: "#f8fafc",
      paper: "#ffffff",
      soft: "rgba(37, 99, 235, 0.06)",
    },

    text: {
      primary: "#0f172a",
      secondary: "#64748b",
    },
  },
});

export const darkTheme = createTheme({
  ...sharedTheme,
  palette: {
    mode: "dark",

    primary: {
      main: "#3b82f6",
    },

    secondary: {
      main: "#22c55e",
    },

    background: {
      default: "#0f172a",
      paper: "#111827",
      soft: "rgba(59, 130, 246, 0.08)",
    },

    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
  },
});