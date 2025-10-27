import './App.css'
import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
//import { GoogleButton } from './components/GoogleButton'
//import { SignupButton } from './components/SignupButton'
import Header from './components/presentacion/Header'
import Hero from './components/presentacion/Hero'
import WhyChoose from './components/presentacion/WhyChoose'
import HowItWorks from './components/presentacion/HowItWorks'
import PopularCategories from './components/presentacion/PopularCategories'
import CommunityImpact from './components/presentacion/CommunityImpact'
import Footer from './components/presentacion/Footer'
import HeaderProfile from './components/productos/header_profile'
import HomePage from "./pages/HomePage";
import DetalleProducto from "./components/productos/DetalleProducto";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ListaCategorias from './components/productos/ListarCategorias'
import PerfilEditar from './pages/PerfilEditar'
import PerfilUsuario from './pages/PerfilUsuario'
import ProductoEditar from './pages/ProductoEditar'
import Publicar from './pages/Publicar'
import MisChats from './pages/MisChats'
import ChatRoom from './pages/ChatRoom'




function App() {
  const { isAuthenticated, isLoading, error } = useAuth0();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando tu sesión...</p>
        </div>
      </div>;
  if (error) return <p>Ocurrió un error: {error.message}</p>;

  return (
    <>
      
      {isAuthenticated ? (
        <>
          <HeaderProfile />
          
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/producto/:id" element={<DetalleProducto />} />
              <Route path="/perfil" element={<PerfilEditar />} />
              <Route path="/usuario/:id" element={<PerfilUsuario />} />
              <Route path="/producto/:id/editar" element={<ProductoEditar />} />
              <Route path="/publicar" element={<Publicar />} />
              <Route path="/chat/:id" element={<ChatRoom />} />
              <Route path="/chats" element={<MisChats />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          
          
        </>
      ) : (
        <>
        <Header />
        <Hero />
        <WhyChoose />
        <HowItWorks />
        <PopularCategories />
        <CommunityImpact />
        <Footer />
        
        {/* <GoogleButton />
        <SignupButton /> */}
        </>
      )}
    </>
  )
}

export default App

