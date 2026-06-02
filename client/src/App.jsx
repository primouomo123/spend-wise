import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

import Budgets from "./pages/Budgets";
import Categories from "./pages/Categories";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Me from "./pages/Me";
import SignUp from "./pages/SignUp";
import Transactions from "./pages/Transactions";
import { useUserContext } from "./contexts/UserContext";

function ProtectedRoute() {
  const { currentUser, authIsLoading } = useUserContext();

  if (authIsLoading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;

  return <Outlet />;
}

function GuestOnlyRoute() {
  const { currentUser, authIsLoading } = useUserContext();

  if (authIsLoading) return null;
  if (currentUser) return <Navigate to="/" replace />;

  return <Outlet />;
}

function CatchAllRoute() {
  const { currentUser, authIsLoading } = useUserContext();

  if (authIsLoading) return null;
  return <Navigate to={currentUser ? "/" : "/login"} replace />;
}

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />}>
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="budget" element={<Budgets />} />
            <Route path="me" element={<Me />} />
          </Route>
        </Route>

        <Route element={<GuestOnlyRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<SignUp />} />
        </Route>

        <Route path="*" element={<CatchAllRoute />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
