import { NavLink } from "react-router-dom";

export default function Header({ isDarkMode, onThemeToggle, onLogout }) {
    return (
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0" }}>
            <nav>
                <NavLink to="/" style={{ marginRight: "1rem" }}>Dashboard</NavLink>
                <NavLink to="/categories" style={{ marginRight: "1rem" }}>Categories</NavLink>
                <NavLink to="/transactions" style={{ marginRight: "1rem" }}>Transactions</NavLink>
                <NavLink to="/budget" style={{ marginRight: "1rem" }}>Budget</NavLink>
                <NavLink to="/me">Me</NavLink>
            </nav>
            <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={onThemeToggle} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                </button>
                <button onClick={onLogout} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
                    Logout
                </button>
            </div>
        </header>
    );
}