import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Budget } from "./pages/Budget";
import { Categories } from "./pages/Categories";
import { Dashboard } from "./pages/Dashboard";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Me } from "./pages/Me";
import { Signup } from "./pages/Signup";
import { Transactions } from "./pages/Transactions";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}>
          <Route index element={<Dashboard />} />
          <Route path="categories" element={<Categories />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="budget" element={<Budget />} />
          <Route path="me" element={<Me />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
