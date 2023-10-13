function autenticar(req, res, next) {
    const { numeroDaContaOrigem, senha } = req.body;

    const contaOrigem = contas.find(conta => conta.numero === numeroDaContaOrigem);

    if (!contaOrigem) {
        return res.status(404).json({ message: "Conta não encontrada. Tente novamente" });
    }

    if (contaOrigem.usuario.senha !== senha) {
        return res.status(400).json({ message: "Senha incorreta. Tente novamente" });
    }


    next();
}
app.use('/rota-requer-autenticacao', autenticar);
