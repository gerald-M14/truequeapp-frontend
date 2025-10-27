import React from 'react';
import { LoginButton } from '../login';

export default function Header() {
  return (
    <header className="bg-white shadow-md" id='inicio'>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="h-12 w-36 flex items-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-full w-auto object-contain"
          />
        </div>

        {/* Navegación */}
        <nav className="hidden md:flex gap-6 text-gray-700 text-sm font-medium">
          <a href="#" className="hover:text-teal-600">Inicio</a>
          <a href="#comofunciona" className="hover:text-teal-600">Cómo Funciona</a>
          <a href="#categorias" className="hover:text-teal-600">Categorías</a>
          <a href="#contacto" className="hover:text-teal-600">Contacto</a>
        </nav>

        {/* Botones de sesión */}
        <div className="hidden md:flex gap-4">
          <button className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-900 transition cursor-pointer">
            <LoginButton />
          </button>
        </div>


        {/* Menú móvil (opcional, si quieres agregar luego) */}
      </div>
    </header>
  );
}
