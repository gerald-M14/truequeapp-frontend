import { useState } from "react";
import ListaCategorias from "../components/productos/ListarCategorias";
import ListaProductos from "../components/productos/ListaProductos";

export default function HomePage() {
  const [categoria, setCategoria] = useState("all");

  return (
    <>
      <ListaCategorias value={categoria} onChange={setCategoria} />
      <ListaProductos categoria={categoria} />
    </>
  );
}
