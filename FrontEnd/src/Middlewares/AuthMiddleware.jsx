import React from "react";
import { Outlet, Navigate } from "react-router-dom";

/*
Obtengo el token de auth. Si existe sigue us ruta normal, sino lo redirecciona a login
*/
export default function AuthMiddleware() {
  const auth_token = localStorage.getItem('auth_token')

  if (auth_token) {
    return <Outlet />
  } else {
    return <Navigate to={'/login'} />
  }
}

