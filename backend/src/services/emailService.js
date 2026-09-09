const { Resend } = require('resend');

// Inicializar Resend com a chave da API
const resend = new Resend(process.env.RESEND_API_KEY);

// A Resend determina quais destinatários o remetente configurado pode alcançar.
const getSender = () => process.env.RESEND_FROM_EMAIL?.trim() || 'BioOrbit <onboarding@resend.dev>';

/**
 * Serviço de envio de emails usando Resend
 */
const emailService = {
    /**
     * Envia email de recuperação de senha
     * @param {string} email - Email do destinatário
     * @param {string} nome - Nome do usuário
     * @param {string} resetUrl - URL de recuperação com token
     */
    async sendPasswordResetEmail(email, nome, resetUrl) {
        try {
            const { data, error } = await resend.emails.send({
                from: getSender(),
                to: [email],
                subject: 'Recuperação de Senha - BioOrbit',
                html: `
                    <!DOCTYPE html>
                    <html lang="pt-BR">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Recuperação de Senha</title>
                    </head>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background-color: #81A030; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0;">BioOrbit</h1>
                        </div>
                        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <h2 style="color: #81A030; margin-top: 0;">Recuperação de Senha</h2>
                            <p>Olá <strong>${nome}</strong>,</p>
                            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>BioOrbit</strong>.</p>
                            <p>Clique no botão abaixo para criar uma nova senha:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetUrl}" 
                                   style="background-color: #81A030; 
                                          color: white; 
                                          padding: 15px 30px; 
                                          text-decoration: none; 
                                          border-radius: 5px; 
                                          display: inline-block;
                                          font-weight: bold;">
                                    Redefinir Senha
                                </a>
                            </div>
                            <p style="color: #666; font-size: 14px;">
                                Ou copie e cole este link no seu navegador:
                            </p>
                            <p style="background-color: #e9e9e9; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
                                ${resetUrl}
                            </p>
                            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                            <p style="color: #999; font-size: 12px;">
                                <strong>⚠️ Importante:</strong><br>
                                • Este link expira em <strong>1 hora</strong><br>
                                • Se você não solicitou esta alteração, ignore este email<br>
                                • Sua senha permanecerá inalterada
                            </p>
                            <p style="color: #999; font-size: 12px; margin-top: 20px;">
                                Atenciosamente,<br>
                                <strong>Equipe BioOrbit</strong>
                            </p>
                        </div>
                        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                            <p>Bio Research do Brasil Instrumentação Científica Ltda</p>
                            <p>Este é um email automático, por favor não responda.</p>
                        </div>
                    </body>
                    </html>
                `
            });

            if (error) {
                console.error('Erro ao enviar email com Resend:', error);
                throw error;
            }

            console.log('Email enviado com sucesso via Resend:', data);
            return data;
        } catch (error) {
            console.error('Erro no serviço de email:', error);
            throw new Error('Falha ao enviar email de recuperação', { cause: error });
        }
    },

    /**
     * Envia email de confirmação após reset bem-sucedido
     * @param {string} email - Email do destinatário
     * @param {string} nome - Nome do usuário
     */
    async sendPasswordResetConfirmation(email, nome) {
        try {
            const { data, error } = await resend.emails.send({
                from: getSender(),
                to: [email],
                subject: 'Senha Alterada com Sucesso - BioOrbit',
                html: `
                    <!DOCTYPE html>
                    <html lang="pt-BR">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Senha Alterada</title>
                    </head>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background-color: #81A030; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0;">BioOrbit</h1>
                        </div>
                        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <h2 style="color: #81A030; margin-top: 0;">✅ Senha Alterada com Sucesso</h2>
                            <p>Olá <strong>${nome}</strong>,</p>
                            <p>Sua senha foi alterada com sucesso!</p>
                            <p>Agora você já pode fazer login com sua nova senha.</p>
                            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                            <p style="color: #999; font-size: 12px;">
                                <strong>⚠️ Não reconhece esta alteração?</strong><br>
                                Se você não realizou esta mudança, entre em contato imediatamente com nosso suporte.
                            </p>
                            <p style="color: #999; font-size: 12px; margin-top: 20px;">
                                Atenciosamente,<br>
                                <strong>Equipe BioOrbit</strong>
                            </p>
                        </div>
                        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                            <p>Bio Research do Brasil Instrumentação Científica Ltda</p>
                            <p>Este é um email automático, por favor não responda.</p>
                        </div>
                    </body>
                    </html>
                `
            });

            if (error) {
                console.error('Erro ao enviar email de confirmação:', error);
                // Não lançar erro aqui, pois a senha já foi alterada
                return null;
            }

            console.log('Email de confirmação enviado:', data);
            return data;
        } catch (error) {
            console.error('Erro ao enviar confirmação:', error);
            // Não bloquear o processo se falhar
            return null;
        }
    }
};

module.exports = emailService;
