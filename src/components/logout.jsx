import React from "react";
import { useAuth0 } from '@auth0/auth0-react'

export const LogoutButton = () => {
  const { logout } = useAuth0()
  return (
    <button className="px-4 py-2 bg-teal-600 cursor-pointer text-white text-sm rounded-lg hover:bg-teal-900 transition" onClick={() => logout({ logoutParams: { returnTo: import.meta.env.VITE_AUTH0_REDIRECT_URI } })}>
      Cerrar sesión
    </button>
  )
}
