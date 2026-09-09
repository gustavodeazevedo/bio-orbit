jest.mock('../../models/Usuario', () => ({
    findOne: jest.fn(),
    findById: jest.fn()
}));
jest.mock('../../models/ResetToken', () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn()
}));
jest.mock('../../services/emailService', () => ({
    sendPasswordResetEmail: jest.fn(),
    sendPasswordResetConfirmation: jest.fn()
}));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));

const Usuario = require('../../models/Usuario');
const ResetToken = require('../../models/ResetToken');
const emailService = require('../../services/emailService');
const jwt = require('jsonwebtoken');
const {
    updateUsuarioPerfil,
    requestPasswordReset,
    resetPassword
} = require('../usuariosController');

const ORIGINAL_EMAIL = 'original@example.com';
const UPDATED_EMAIL = 'updated@example.com';

const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
});

describe('edição do perfil com email bloqueado', () => {
    let usuario;

    beforeEach(() => {
        jest.resetAllMocks();
        usuario = {
            _id: 'usuario-de-teste',
            nome: 'Nome anterior',
            email: ORIGINAL_EMAIL,
            cargo: 'Cargo anterior',
            setor: 'Setor anterior',
            senha: 'senha-anterior',
            matchPassword: jest.fn().mockResolvedValue(true),
            save: jest.fn(async () => usuario)
        };
        Usuario.findById.mockResolvedValue(usuario);
        jwt.sign.mockReturnValue('jwt-de-teste');
    });

    it.each([UPDATED_EMAIL, '', null])('rejeita email diferente (%s) sem alterar outros dados ou senha', async (email) => {
        const res = createResponse();

        await updateUsuarioPerfil({
            usuario: { _id: usuario._id },
            body: {
                email,
                nome: 'Novo nome',
                cargo: 'Novo cargo',
                setor: 'Novo setor',
                senhaAtual: 'senha-anterior',
                novaSenha: 'nova-senha'
            }
        }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'O e-mail da conta não pode ser alterado pelo perfil.'
        });
        expect(usuario).toEqual(expect.objectContaining({
            nome: 'Nome anterior',
            email: ORIGINAL_EMAIL,
            cargo: 'Cargo anterior',
            setor: 'Setor anterior',
            senha: 'senha-anterior'
        }));
        expect(usuario.matchPassword).not.toHaveBeenCalled();
        expect(usuario.save).not.toHaveBeenCalled();
        expect(jwt.sign).not.toHaveBeenCalled();
    });

    it.each([
        ['omitido', {}],
        ['igual ao salvo', { email: ORIGINAL_EMAIL }]
    ])('salva outros campos com email %s', async (_, emailPayload) => {
        const res = createResponse();

        await updateUsuarioPerfil({
            usuario: { _id: usuario._id },
            body: {
                ...emailPayload,
                nome: 'Novo nome',
                cargo: 'Novo cargo',
                setor: 'Novo setor'
            }
        }, res);

        expect(usuario.save).toHaveBeenCalledTimes(1);
        expect(usuario.senha).toBe('senha-anterior');
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            _id: usuario._id,
            nome: 'Novo nome',
            email: ORIGINAL_EMAIL,
            cargo: 'Novo cargo',
            setor: 'Novo setor',
            token: 'jwt-de-teste'
        }));
    });

    it('permite alterar a senha com a senha atual correta, mantendo o email', async () => {
        const res = createResponse();

        await updateUsuarioPerfil({
            usuario: { _id: usuario._id },
            body: { senhaAtual: 'senha-anterior', novaSenha: 'nova-senha' }
        }, res);

        expect(usuario.matchPassword).toHaveBeenCalledWith('senha-anterior');
        expect(usuario.senha).toBe('nova-senha');
        expect(usuario.email).toBe(ORIGINAL_EMAIL);
        expect(usuario.save).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });
});

describe('recuperação de senha com o email salvo da conta', () => {
    let usuario;
    let savedEmail;
    let originalFrontendUrl;

    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
        originalFrontendUrl = process.env.FRONTEND_URL;
        process.env.FRONTEND_URL = 'https://bioorbit.example.com';

        savedEmail = ORIGINAL_EMAIL;
        usuario = {
            _id: 'usuario-com-email-alterado',
            nome: 'Usuário de teste',
            email: ORIGINAL_EMAIL,
            senha: 'senha-anterior',
            save: jest.fn(async () => {
                savedEmail = usuario.email;
                return usuario;
            })
        };
        Usuario.findById.mockResolvedValue(usuario);
        Usuario.findOne.mockImplementation(({ email }) => ({
            maxTimeMS: jest.fn().mockResolvedValue(email === savedEmail ? usuario : null)
        }));
        ResetToken.create.mockResolvedValue({});
        emailService.sendPasswordResetEmail.mockResolvedValue({ id: 'email-de-teste' });
        emailService.sendPasswordResetConfirmation.mockResolvedValue({ id: 'confirmacao-de-teste' });
        jwt.sign.mockReturnValue('jwt-de-teste');
    });

    afterEach(() => {
        jest.restoreAllMocks();
        if (originalFrontendUrl === undefined) {
            delete process.env.FRONTEND_URL;
        } else {
            process.env.FRONTEND_URL = originalFrontendUrl;
        }
    });

    const usePreviouslyChangedEmail = () => {
        // Contas legadas podem ter alterado o email antes do bloqueio no perfil.
        usuario.email = UPDATED_EMAIL;
        savedEmail = UPDATED_EMAIL;
    };

    it('envia as instruções para o email original de uma conta existente', async () => {
        const res = createResponse();

        await requestPasswordReset({ body: { email: ORIGINAL_EMAIL } }, res);

        expect(ResetToken.create).toHaveBeenCalledTimes(1);
        const { token, usuario: usuarioId } = ResetToken.create.mock.calls[0][0];
        expect(usuarioId).toBe(usuario._id);
        expect(token).toMatch(/^[a-f0-9]{64}$/);
        expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
        expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
            ORIGINAL_EMAIL,
            usuario.nome,
            `https://bioorbit.example.com/redefinir-senha/${token}`
        );
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            message: 'Email de recuperação enviado. Verifique sua caixa de entrada.'
        });
    });

    it('envia a recuperação para o email atual de uma conta legada, mantendo o mesmo usuário', async () => {
        usePreviouslyChangedEmail();
        const res = createResponse();

        await requestPasswordReset({ body: { email: UPDATED_EMAIL } }, res);

        expect(Usuario.findOne).toHaveBeenCalledWith({ email: UPDATED_EMAIL });
        expect(ResetToken.create).toHaveBeenCalledWith({
            usuario: usuario._id,
            token: expect.any(String)
        });
        const { token } = ResetToken.create.mock.calls[0][0];
        expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
        expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
            UPDATED_EMAIL,
            usuario.nome,
            `https://bioorbit.example.com/redefinir-senha/${token}`
        );
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            message: 'Email de recuperação enviado. Verifique sua caixa de entrada.'
        });
    });

    it('não envia recuperação para o email antigo depois da alteração', async () => {
        usePreviouslyChangedEmail();
        const res = createResponse();

        await requestPasswordReset({ body: { email: ORIGINAL_EMAIL } }, res);

        expect(ResetToken.create).not.toHaveBeenCalled();
        expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação.'
        });
    });

    it('não informa sucesso quando o provedor recusa o envio para o novo email', async () => {
        usePreviouslyChangedEmail();
        const deleteOne = jest.fn().mockResolvedValue(undefined);
        ResetToken.create.mockResolvedValueOnce({ deleteOne });
        emailService.sendPasswordResetEmail.mockRejectedValueOnce(
            new Error('SMTP authentication failed')
        );
        const res = createResponse();

        await requestPasswordReset({ body: { email: UPDATED_EMAIL } }, res);

        expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
            UPDATED_EMAIL,
            usuario.nome,
            expect.any(String)
        );
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Erro ao processar solicitação. Tente novamente mais tarde.'
        });
        expect(deleteOne).toHaveBeenCalledTimes(1);
    });

    it('redefine a senha do usuário vinculado ao token e confirma no email atual', async () => {
        await requestPasswordReset({ body: { email: ORIGINAL_EMAIL } }, createResponse());
        const tokenCriado = ResetToken.create.mock.calls[0][0];
        usePreviouslyChangedEmail();

        const resetToken = {
            token: tokenCriado.token,
            usuario,
            usado: false,
            save: jest.fn().mockResolvedValue(undefined)
        };
        ResetToken.findOne.mockImplementation(({ token }) => ({
            populate: jest.fn().mockResolvedValue(
                token === tokenCriado.token && tokenCriado.usuario === usuario._id ? resetToken : null
            )
        }));
        const res = createResponse();

        await resetPassword({
            params: { token: tokenCriado.token },
            body: { senha: 'nova-senha-de-teste' }
        }, res);

        expect(usuario.senha).toBe('nova-senha-de-teste');
        expect(usuario.save).toHaveBeenCalledTimes(1);
        expect(resetToken.usado).toBe(true);
        expect(resetToken.save).toHaveBeenCalledTimes(1);
        expect(emailService.sendPasswordResetConfirmation).toHaveBeenCalledTimes(1);
        expect(emailService.sendPasswordResetConfirmation).toHaveBeenCalledWith(
            UPDATED_EMAIL,
            usuario.nome
        );
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            message: 'Senha redefinida com sucesso! Você já pode fazer login.'
        });
    });
});
