# Recuperação de senha e Gmail SMTP

O perfil, o login e a recuperação usam o campo `email` da mesma coleção de
usuários. O perfil exibe esse endereço como somente leitura e a API rejeita
tentativas de alterá-lo. O token de recuperação referencia o ID do usuário.

## Configuração no Render

O backend usa Nodemailer com Gmail SMTP. Configure no serviço do Render:

```env
EMAIL_USER=conta-remetente@gmail.com
EMAIL_APP_PASSWORD=senha-de-app-do-gmail
FRONTEND_URL=https://bio-orbit.vercel.app
```

`EMAIL_APP_PASSWORD` deve ser uma senha de app do Google, nunca a senha normal
da conta. A credencial não deve ser commitada nem impressa nos logs.

O remetente exibido é `BioOrbit <EMAIL_USER>`. O serviço envia o link de
recuperação e a confirmação após a senha ser alterada.

## Segurança e falhas de envio

O endpoint continua sem revelar se um endereço existe no banco. O token usa os
campos existentes `token`, `expiresAt` e `usado`, mantendo a validade de uma
hora e a expiração automática do documento em duas horas.

Quando o envio SMTP falha depois da criação do token, o token recém-criado é
removido do MongoDB. O backend registra apenas a mensagem técnica do erro, sem
expor credenciais ou detalhes SMTP ao frontend.

## Validação local

Execute os testes com o transporte de e-mail simulado:

```sh
cd backend
npm test -- --runInBand
```

Para validar a autenticação real, use as variáveis de ambiente no Render e
confirme nos logs que o backend iniciou sem erro de SMTP. Não coloque a senha
de app em arquivos versionados.

Referência: [senhas de app do Google](https://support.google.com/accounts/answer/13548313).
