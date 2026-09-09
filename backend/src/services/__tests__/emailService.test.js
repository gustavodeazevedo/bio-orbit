const mockSendMail = jest.fn();
const mockVerify = jest.fn();
const mockCreateTransport = jest.fn(() => ({
    sendMail: mockSendMail,
    verify: mockVerify
}));

jest.mock('nodemailer', () => ({
    createTransport: mockCreateTransport
}));

const emailService = require('../emailService');
const originalEnv = { ...process.env };

beforeEach(() => {
    jest.resetAllMocks();
    mockCreateTransport.mockImplementation(() => ({
        sendMail: mockSendMail,
        verify: mockVerify
    }));
    process.env.EMAIL_USER = 'syngonium.br@gmail.com';
    process.env.EMAIL_APP_PASSWORD = 'app password for test';
    mockSendMail.mockResolvedValue({ messageId: 'email-id' });
    mockVerify.mockResolvedValue(true);
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
});

test.each(['cadastro@example.net', 'novo-email@example.net'])(
    'envia a recuperação para %s usando Gmail SMTP', async (email) => {
        await emailService.sendPasswordResetEmail(
            email,
            'Usuário',
            'https://example.com/redefinir-senha/token'
        );

        expect(mockCreateTransport).toHaveBeenCalledWith({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'syngonium.br@gmail.com',
                pass: 'apppasswordfortest'
            }
        });
        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            from: 'BioOrbit <syngonium.br@gmail.com>',
            to: email,
            html: expect.stringContaining('https://example.com/redefinir-senha/token')
        }));
    }
);

test('não envia sem credenciais SMTP configuradas', async () => {
    delete process.env.EMAIL_APP_PASSWORD;

    await expect(emailService.sendPasswordResetEmail(
        'novo@example.net',
        'Usuário',
        'https://example.com/reset'
    )).rejects.toMatchObject({ message: 'Falha ao enviar email de recuperação' });

    expect(mockSendMail).not.toHaveBeenCalled();
});

test('preserva a falha SMTP sem expor detalhes no erro principal', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP authentication failed'));

    await expect(emailService.sendPasswordResetEmail(
        'novo@example.net',
        'Usuário',
        'https://example.com/reset'
    )).rejects.toMatchObject({ message: 'Falha ao enviar email de recuperação' });
});

test('verifica a autenticação do transporter', async () => {
    await expect(emailService.verifyTransporter()).resolves.toBe(true);
    expect(mockVerify).toHaveBeenCalledTimes(1);
});

test('confirmação usa o mesmo remetente Gmail', async () => {
    await emailService.sendPasswordResetConfirmation('novo@example.net', 'Usuário');

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
        from: 'BioOrbit <syngonium.br@gmail.com>',
        to: 'novo@example.net'
    }));
});

test('falha na confirmação não desfaz uma redefinição concluída', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP unavailable'));

    await expect(emailService.sendPasswordResetConfirmation('novo@example.net', 'Usuário'))
        .resolves.toBeNull();
});
