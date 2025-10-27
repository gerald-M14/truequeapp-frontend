import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

export const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 bg-gray-100 px-3 py-2 rounded-lg shadow-sm">
      <img
        src={user.picture}
        alt={user.name}
        className="w-10 h-10 rounded-full object-cover border"
      />
      <div className="flex flex-col">
        <h2 className="text-sm font-semibold text-gray-800 truncate max-w-[150px]">
          {user.name}
        </h2>
        
      </div>
    </div>
  );
};
