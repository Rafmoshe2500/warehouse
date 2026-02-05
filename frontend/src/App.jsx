import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';
import queryClient from './config/queryClient';
import './styles/index.css';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
