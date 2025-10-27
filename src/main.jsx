import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react'
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URL   // http://localhost:5173
      }}
      onRedirectCallback={(appState) => {
        // vuelve a donde estaba el user o al home
        const target = appState?.returnTo || window.location.pathname
        window.history.replaceState({}, document.title, target)
      }}
    >
      <App />
      
    </Auth0Provider>
    </BrowserRouter>
  </StrictMode>
)