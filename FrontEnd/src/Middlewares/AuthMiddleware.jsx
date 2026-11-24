import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";

/*
Obtengo el token de auth. Si existe sigue su ruta normal, sino lo redirecciona a login.

Se guarda el destino (pathname + querystring) en ?redirect= para poder volver
despues del login. Es lo que permite que un link de invitacion
(/accept-invite?workspace_id=...&invitation_token=...) sobreviva al login.
*/
export default function AuthMiddleware() {
  const auth_token = localStorage.getItem('auth_token')
  const location = useLocation()

  if (auth_token) {
    return <Outlet />
  }

  const redirect = encodeURIComponent(location.pathname + location.search)
  return <Navigate to={`/login?redirect=${redirect}`} />
}
