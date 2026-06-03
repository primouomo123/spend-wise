import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UserProvider } from './contexts/UserContext.jsx';
import { CategoryProvider } from './contexts/CategoryContext.jsx';
import { TransactionProvider } from './contexts/TransactionContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <CategoryProvider>
        <TransactionProvider>
          <App />
        </TransactionProvider>
      </CategoryProvider>
    </UserProvider>
  </StrictMode>,
)