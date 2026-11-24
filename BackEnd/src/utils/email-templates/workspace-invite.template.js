/*
Template del mail de invitacion a un espacio de trabajo.

Cada funcion devuelve { subject, html } listo para pasarle a
mailerTransporter.sendMail().

El link apunta a la pantalla /accept-invite del frontend con el workspace_id
y el token por querystring. La aceptacion se hace desde ahi, con la sesion
iniciada, para que solo la persona invitada pueda unirse.

El HTML usa solo estilos inline y tablas, igual que el resto de los templates,
porque los clientes de correo no soportan CSS externo ni SVG.
*/
import ENVIROMMENT from "../../config/enviromment.config.js";

/*
Escapa los caracteres peligrosos de los textos que vienen de la DB
(nombre del invitador y del workspace) para no inyectar HTML en el mail.
*/
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/*
Mail de invitacion a un workspace.
- invitationToken: JWT firmado con el workspace, el email invitado y el rol.
- workspaceId: id del workspace (va en el link para validar el par).
- workspaceName: nombre visible del workspace.
- inviterName: nombre de quien invita (se muestra en el asunto y el cuerpo).
*/
export function workspaceInviteTemplate({ invitationToken, workspaceId, workspaceName, inviterName }) {
  const invitador = escapeHtml(inviterName || 'Un miembro del equipo')
  const espacio = escapeHtml(workspaceName || 'un espacio de trabajo')

  const subject = `${inviterName || 'Un miembro del equipo'} te invito a ${workspaceName || 'un espacio de trabajo'}`

  const acceptUrl = `${ENVIROMMENT.URL_FRONTEND}/accept-invite?workspace_id=${encodeURIComponent(workspaceId)}&invitation_token=${encodeURIComponent(invitationToken)}`

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden;">
              <!-- Header: aubergine Slack -->
              <tr>
                <td align="center" style="background-color: #481A54; padding: 34px 20px 30px;">
                  <!-- Logo trebol de 4 hojas (2x2 con border-radius) -->
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 16px;">
                    <tr>
                      <td width="22" height="22" style="width: 22px; height: 22px; background-color: #36C5F0; border-radius: 50% 50% 0 50%;">&nbsp;</td>
                      <td width="22" height="22" style="width: 22px; height: 22px; background-color: #2EB67D; border-radius: 50% 50% 50% 0;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td width="22" height="22" style="width: 22px; height: 22px; background-color: #E01E5A; border-radius: 50% 0 50% 50%;">&nbsp;</td>
                      <td width="22" height="22" style="width: 22px; height: 22px; background-color: #ECB22E; border-radius: 0 50% 50% 50%;">&nbsp;</td>
                    </tr>
                  </table>
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Te invitaron a un espacio de trabajo</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 30px; text-align: center;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 12px;">
                    <strong>${invitador}</strong> te invito a unirte a <strong>${espacio}</strong>.
                  </p>
                  <p style="color: #555555; font-size: 15px; line-height: 1.5; margin: 0 0 25px;">
                    Si aceptas, vas a poder ver los canales y conversar con el resto del equipo.
                  </p>
                  <!-- Boton CTA -->
                  <a href="${acceptUrl}"
                     style="display: inline-block; background-color: #481A54; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; padding: 14px 28px; border-radius: 6px; box-shadow: 0 2px 5px rgba(72, 26, 84, 0.4);">
                    Aceptar invitacion
                  </a>
                  <p style="color: #777777; font-size: 13px; margin-top: 30px; line-height: 1.4;">
                    Esta invitacion expira en 7 dias. Si no esperabas este correo, podes ignorarlo:
                    no vas a unirte al espacio hasta que aceptes.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #f9fafb; padding: 15px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
                  © 2026 GonzaAPP. Todos los derechos reservados.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  return { subject, html }
}
