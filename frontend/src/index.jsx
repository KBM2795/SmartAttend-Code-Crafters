import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import AuthContext from './context/authContext.jsx'
// ...existing imports...

ReactDOM.createRoot(document.getElementById('root')).render(

    <AuthProvider>

<AuthContext>
    <App />
  </AuthContext>,
    </AuthProvider>
 
);
