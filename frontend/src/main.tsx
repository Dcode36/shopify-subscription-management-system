import { ApolloProvider } from '@apollo/client/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { apolloClient } from './apollo/client.js';
import { CustomerProvider } from './auth/CustomerProvider.js';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <CustomerProvider>
          <App />
        </CustomerProvider>
      </BrowserRouter>
    </ApolloProvider>
  </StrictMode>,
);
