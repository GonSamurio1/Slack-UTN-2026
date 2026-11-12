/*
Templates de mails: cada funcion devuelve { subject, html } listo para
pasarle a mailerTransporter.sendMail().

El HTML usa solo estilos inline y tablas, porque los clientes de correo
(Gmail, Outlook, etc.) no soportan CSS externo ni SVG.
Colores: paleta Slack del proyecto (#481A54 aubergine, azul, verde, amarillo y rojo).
*/
import ENVIROMMENT from "../../config/enviromment.config.js";

/*
Mail de restablecimiento de contraseña.
El link apunta a la pantalla /reset-password del frontend con el token por querystring.
*/
export function resetPasswordTemplate(resetPasswordToken) {
  const subject = 'Restablece tu contraseña'

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
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Restablece tu contraseña</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 30px; text-align: center;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                    Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé clic en el siguiente botón para elegir una nueva:
                  </p>
                  <!-- Boton CTA -->
                  <a href="${ENVIROMMENT.URL_FRONTEND}/reset-password?reset_token=${resetPasswordToken}"
                     style="display: inline-block; background-color: #481A54; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; padding: 14px 28px; border-radius: 6px; box-shadow: 0 2px 5px rgba(72, 26, 84, 0.4);">
                    Restablecer contraseña
                  </a>
                  <p style="color: #777777; font-size: 13px; margin-top: 30px; line-height: 1.4;">
                    Si no fuiste vos, podés ignorar este correo de forma segura: tu contraseña no cambiara.
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
