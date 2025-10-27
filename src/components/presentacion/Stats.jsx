import React from 'react';

export default function Stats() {
  return (
    <div className="border-t mt-8 pt-6 grid grid-cols-3 text-center text-teal-700 font-semibold text-lg">
      <div>
        <p>1000+</p>
        <p className="text-sm font-normal text-gray-500">Usuarios Activos</p>
      </div>
      <div>
        <p>5000+</p>
        <p className="text-sm font-normal text-gray-500">Intercambios Exitosos</p>
      </div>
      <div>
        <p>50+</p>
        <p className="text-sm font-normal text-gray-500">Categorías</p>
      </div>
    </div>
  );
}
