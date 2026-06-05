import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UserProvider } from './contexts/UserContext.jsx';
import { CategoryProvider } from './contexts/CategoryContext.jsx';
import { TransactionProvider } from './contexts/TransactionContext.jsx';
import { BudgetProvider } from './contexts/BudgetContext.jsx';
import { DashboardProvider } from './contexts/DashboardContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <CategoryProvider>
        <TransactionProvider>
          <BudgetProvider>
            <DashboardProvider>
              <ThemeProvider>
                <App />
              </ThemeProvider>
            </DashboardProvider>
          </BudgetProvider>
        </TransactionProvider>
      </CategoryProvider>
    </UserProvider>
  </StrictMode>,
)