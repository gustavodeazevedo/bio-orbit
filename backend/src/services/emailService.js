const nodemailer = require('nodemailer');

const getEmailUser = () => process.env.EMAIL_USER?.trim();

const getAppPassword = () => process.env.EMAIL_APP_PASSWORD
    ?.replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, '');

const getTransporter = () => nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: getEmailUser(),
        pass: getAppPassword()
    }
});

const getSender = () => `BioOrbit <${getEmailUser()}>`;

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const sendMail = async ({ to, subject, html }) => {
    if (!getEmailUser() || !getAppPassword()) {
        console.error('SMTP do Gmail não configurado:', {
            hasEmailUser: Boolean(getEmailUser()),
            hasAppPassword: Boolean(getAppPassword())
        });
        throw new Error('Credenciais de email não configuradas');
    }

    return getTransporter().sendMail({
        from: getSender(),
        to,
        subject,
        html
    });
};

/**
 * Envia email de recuperação de senha.
 * @param {string} email - Email do destinatário
 * @param {string} nome - Nome do usuário
 * @param {string} resetUrl - URL completa de redefinição
 */
const sendPasswordResetEmail = async (email, nome, resetUrl) => {
    const safeName = escapeHtml(nome);
    const safeResetUrl = escapeHtml(resetUrl);

    try {
        const info = await sendMail({
            to: email,
            subject: 'Recuperação de senha - BioOrbit',
            html: `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Recuperação de senha - BioOrbit</title>
                </head>
                <body style="margin:0;background:#f5f7f2;font-family:Arial,sans-serif;color:#4b5563;line-height:1.6;">
                    <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
                        <div style="background:#90c72d;padding:22px;border-radius:12px 12px 0 0;text-align:center;">
                            <h1 style="color:#fff;margin:0;font-size:24px;">BioOrbit</h1>
                        </div>
                        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;">
                            <h2 style="color:#374151;margin:0 0 16px;">Redefinição de senha</h2>
                            <p>Olá, <strong>${safeName}</strong>.</p>
                            <p>Recebemos uma solicitação para redefinir a senha da sua conta no BioOrbit.</p>
                            <div style="text-align:center;margin:28px 0;">
                                <a href="${safeResetUrl}" style="display:inline-block;background:#90c72d;color:#fff;padding:13px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Redefinir senha</a>
                            </div>
                            <p style="font-size:13px;color:#6b7280;word-break:break-all;">Se o botão não funcionar, acesse:<br>${safeResetUrl}</p>
                            <p style="font-size:13px;color:#6b7280;">Se você não solicitou esta alteração, ignore este e-mail. Sua senha permanecerá inalterada.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        console.log('Email de recuperação enviado com sucesso:', info.messageId);
        return info;
    } catch (error) {
        console.error('Erro ao enviar email de recuperação via Gmail SMTP:', {
            code: error.code,
            responseCode: error.responseCode,
            message: error.message
        });
        throw new Error('Falha ao enviar email de recuperação', { cause: error });
    }
};

/**
 * Envia confirmação após a redefinição da senha.
 * @param {string} email - Email do destinatário
 * @param {string} nome - Nome do usuário
 */
const sendPasswordResetConfirmation = async (email, nome) => {
    const safeName = escapeHtml(nome);

    try {
        const info = await sendMail({
            to: email,
            subject: 'Senha alterada com sucesso - BioOrbit',
            html: `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head><meta charset="UTF-8"><title>Senha alterada - BioOrbit</title></head>
                <body style="margin:0;background:#f5f7f2;font-family:Arial,sans-serif;color:#4b5563;line-height:1.6;">
                    <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
                        <div style="background:#90c72d;padding:22px;border-radius:12px 12px 0 0;text-align:center;"><h1 style="color:#fff;margin:0;">BioOrbit</h1></div>
                        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;">
                            <h2 style="color:#374151;margin:0 0 16px;">Senha alterada com sucesso</h2>
                            <p>Olá, <strong>${safeName}</strong>.</p>
                            <p>Sua senha do BioOrbit foi alterada com sucesso. Se você não realizou esta alteração, entre em contato com o suporte.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        console.log('Email de confirmação enviado com sucesso:', info.messageId);
        return info;
    } catch (error) {
        console.error('Erro ao enviar confirmação via Gmail SMTP:', {
            code: error.code,
            responseCode: error.responseCode,
            message: error.message
        });
        return null;
    }
};

const verifyTransporter = async () => {
    if (!getEmailUser() || !getAppPassword()) {
        throw new Error('Credenciais de email não configuradas');
    }

    return getTransporter().verify();
};

module.exports = {
    sendPasswordResetEmail,
    sendPasswordResetConfirmation,
    verifyTransporter
};
