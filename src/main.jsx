import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; 
import './index.css';

// 1. React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 2. Context Providers
// import { AuthProvider } from './features/auth/AuthProvider.jsx';
// import { CartContext } from './context/CartContext.jsx'; 
// import { WishlistContext } from './context/WishlistContext.jsx';
// import { SearchContext } from './context/SearchContext.jsx';

const queryClient = new QueryClient({
defaultOptions: {
queries: {
staleTime: 1000 * 60 * 5,
refetchOnWindowFocus: false,
},
},
});

ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>

<QueryClientProvider client={queryClient}>


  {/* <AuthProvider> */}

    {/* <SearchContext>
      <WishlistContext>
        <CartContext> */}

          <App />

        {/* </CartContext>
      </WishlistContext>
    </SearchContext> */}

  {/* </AuthProvider> */}

</QueryClientProvider>

</React.StrictMode>
);