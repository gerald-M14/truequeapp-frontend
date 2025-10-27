import React from 'react';
import { Gift } from 'lucide-react';

export default function SuggestedSwapCard() {
  return (
    <div className="bg-white rounded-xl shadow-xl p-6 lg:p-8 transform rotate-2 hover:rotate-0 transition-transform duration-300 w-full max-w-md lg:max-w-lg mx-auto md:mx-0">
  <div className="flex items-center gap-2 mb-2 text-teal-700 font-semibold text-base lg:text-lg">
    <Gift className="w-5 h-5" />
    Intercambio Sugerido
  </div>

  <p className="text-sm text-gray-500 mb-6">Coincidencia perfecta encontrada</p>

  <div className="grid grid-cols-2 gap-6 mb-6">
    {/* Producto propio */}
    <div className="text-center">
      <div className="bg-gray-200 border-2 border-teal-600 border-dotted rounded-md h-24 lg:h-28 mb-2 flex items-center justify-center overflow-hidden">
        <img
          src="/camara.jpeg"
          alt="Logo"
          className="w-full h-auto object-contain"
        />
      </div>
      <p className="font-medium text-base">Tu Producto</p>
      <p className="text-sm text-gray-500">Cámara Digital</p>
    </div>

    {/* Producto de otra persona */}
    <div className="text-center">
      <div className="bg-gray-200 border-2 border-teal-600 border-dotted rounded-md h-24 lg:h-28 mb-2 flex items-center justify-center overflow-hidden">
        <img
          src="/guitarra.webp"
          alt="Logo"
          className="w-full h-auto object-contain"
        />
      </div>

      <p className="font-medium text-base">Su Producto</p>
      <p className="text-sm text-gray-500">Guitarra Acústica</p>
    </div>
  </div>

  <button className="bg-teal-600 text-white w-full py-2.5 lg:py-3 rounded text-sm lg:text-base hover:bg-teal-700 transition">
    Enviar Solicitud de Intercambio
  </button>
</div>

  );
}
