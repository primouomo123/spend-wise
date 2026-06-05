import { createTheme } from "@mui/material/styles";

const sharedTheme = {
  shape: {
    borderRadius: 14,
  },

  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",

    h1: {
      fontWeight: 700,
      letterSpacing: "-0.04em",
    },

    h2: {
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },

    h4: {
      fontWeight: 600,
    },

    h6: {
      fontWeight: 600,
    },

    body2: {
      lineHeight: 1.5,
    },
  },

  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },

      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        fullWidth: true,
      },
    },
  },
};

export const lightTheme = createTheme({
  ...sharedTheme,

  palette: {
    mode: "light",

    primary: {
      main: "#2563eb",
    },

    secondary: {
      main: "#10b981",
    },

    success: {
      main: "#16a34a",
    },

    warning: {
      main: "#f59e0b",
    },

    error: {
      main: "#dc2626",
    },

    info: {
      main: "#0284c7",
    },

    background: {
      default: "#f8fafc",
      paper: "#ffffff",
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

    success: {
      main: "#22c55e",
    },

    warning: {
      main: "#fbbf24",
    },

    error: {
      main: "#ef4444",
    },

    info: {
      main: "#38bdf8",
    },

    background: {
      default: "#0f172a",
      paper: "#111827",
    },

    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
  },
});