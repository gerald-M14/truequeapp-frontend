import React from 'react'
import { LoginButton } from '../login';

export default function CallToAction() {
  return (
    <div className="bg-gray-900 py-16 px-6">
      <div className="max-w-screen-2xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
          ¿Listo para comenzar a intercambiar?
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-8">
          Únete a miles de usuarios que ya están intercambiando productos y construyendo una comunidad más sostenible.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="bg-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-600 transition">
            <LoginButton />
          </button>
          {/* <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-gray-900 transition">
            Explorar Productos
          </button> */}
        </div>
      </div>
    </div>
  )
}
