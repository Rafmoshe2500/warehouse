import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import AppRouter from './router';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';
import './styles/index.css';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <ThemeProvider>
              <AppRouter />
            </ThemeProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
