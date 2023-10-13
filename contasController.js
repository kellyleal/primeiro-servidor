const bancodedados = require('../bancodedados');

exports.listarContas = (req, res) => {
  const contas = JSON.parse(JSON.stringify(bancodedados.contas));
  contas.forEach(conta => {
    delete conta.usuario.senha;
  });
  res.json(contas);
};

exports.criarConta = (req, res) => {
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;
  
    const contaExistente = bancodedados.contas.find(conta => conta.usuario.cpf === cpf || conta.usuario.email === email);
    if (contaExistente) {
      return res.status(400).json({ mensagem: 'Já existe uma conta com este CPF ou e-mail.' });
    }
  
    const novaConta = {
      numero: bancodedados.contas.length + 1,
      saldo: 0,
      usuario: {
        nome,
        cpf,
        data_nascimento,
        telefone,
        email,
        senha
      }
    };
  
    bancodedados.contas.push(novaConta);
  
    return res.status(201).end();
};

exports.atualizarConta = (req, res) => {
    const { numero } = req.params;
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

    const conta = bancodedados.contas.find(conta => conta.numero === numero);
    
     if (!conta) {
        return res.status(404).json({ mensagem: 'Conta não encontrada.' });
     }

    const contaExistente = bancodedados.contas.find(c => c.usuario.cpf === cpf || c.usuario.email === email);
    if (contaExistente && contaExistente.numero !== numero) {
        return res.status(400).json({ mensagem: 'Já existe uma conta com este CPF ou e-mail.' });
    }

    conta.usuario.nome = nome || conta.usuario.nome;
    conta.usuario.cpf = cpf || conta.usuario.cpf;
    conta.usuario.data_nascimento = data_nascimento || conta.usuario.data_nascimento;
    conta.usuario.telefone = telefone || conta.usuario.telefone;
    conta.usuario.email = email || conta.usuario.email;
    conta.usuario.senha = senha || conta.usuario.senha;

    return res.status(200).end();
};

exports.excluirConta = (req, res) => {
  const { numero } = req.params;

  const indice = bancodedados.contas.findIndex(conta => conta.numero === numero);
  
  if (indice === -1) {
    return res.status(404).json({ mensagem: 'Conta não encontrada.' });
  }

  if (bancodedados.contas[indice].saldo !== 0) {
    return res.status(400).json({ mensagem: 'A conta só pode ser removida se o saldo for zero!' });
  }

  bancodedados.contas.splice(indice, 1);

  return res.status(200).end();
};

exports.realizarDeposito = (req, res) => {
    const { numero } = req.params;
    let { quantia } = req.body;

    quantia = Math.round(quantia * 100);

    if (quantia <= 0) {
        return res.status(400).json({ mensagem: 'O valor do depósito deve ser maior que zero.' });
    }

    const conta = bancodedados.contas.find(conta => conta.numero === numero);
    
     if (!conta) {
        return res.status(404).json({ mensagem: 'Conta não encontrada.' });
     }

     conta.saldo += quantia;

     return res.status(200).end();
};

exports.realizarSaque = (req, res) => {
    const { numero } = req.params;
    let { quantia } = req.body;

    quantia = Math.round(quantia * 100);

    if (quantia <= 0) {
        return res.status(400).json({ mensagem: 'O valor do saque deve ser maior que zero.' });
    }

    const conta = bancodedados.contas.find(conta => conta.numero === numero);
    
     if (!conta) {
        return res.status(404).json({ mensagem: 'Conta não encontrada.' });
     }

     if (conta.saldo < quantia) {
        return res.status(400).json({ mensagem: 'Saldo insuficiente.' });
     }

     conta.saldo -= quantia;

     return res.status(200).end();
};

exports.realizarTransferencia = (req, res) => {
    const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body;

    if (!numero_conta_origem || !numero_conta_destino || !valor || !senha) {
        return res.status(400).json({ mensagem: 'O número da conta de origem, de destino, senha da conta de origem e valor da transferência devem ser informados.' });
    }

    const contaOrigem = bancodedados.contas.find(conta => conta.numero === numero_conta_origem);
    const contaDestino = bancodedados.contas.find(conta => conta.numero === numero_conta_destino);
    
     if (!contaOrigem || !contaDestino) {
        return res.status(404).json({ mensagem: 'Conta não encontrada.' });
     }

     if (contaOrigem.usuario.senha !== senha) {
        return res.status(400).json({ mensagem: 'Senha inválida.' });
     }

     if (contaOrigem.saldo < valor) {
        return res.status(400).json({ mensagem: 'Saldo insuficiente na conta de origem.' });
     }

     contaOrigem.saldo -= valor;
     contaDestino.saldo += valor;

     return res.status(200).end();
};

exports.consultarSaldo = (req, res) => {
    const { numero_conta, senha } = req.query;

    if (!numero_conta || !senha) {
        return res.status(400).json({ mensagem: 'O número da conta e a senha são obrigatórios!' });
    }

    const conta = bancodedados.contas.find(conta => conta.numero === numero_conta);
    
     if (!conta) {
        return res.status(404).json({ mensagem: 'Conta não encontrada.' });
     }

     if (conta.usuario.senha !== senha) {
        return res.status(400).json({ mensagem: 'Senha inválida.' });
     }

     return res.json({ saldo: conta.saldo });
};

exports.emitirExtrato = (req, res) => {
    const { numero_conta, senha } = req.query;

    if (!numero_conta || !senha) {
        return res.status(400).json({ mensagem: 'O número da conta e a senha são obrigatórios!' });
    }

    const conta = bancodedados.contas.find(conta => conta.numero === numero_conta);
    
     if (!conta) {
        return res.status(404).json({ mensagem: 'Conta não encontrada.' });
     }

     if (conta.usuario.senha !== senha) {
        return res.status(400).json({ mensagem: 'Senha inválida.' });
     }

     const depositos = bancodedados.depositos.filter(deposito => deposito.numero_conta === numero_conta);
     const saques = bancodedados.saques.filter(saque => saque.numero_conta === numero_conta);
     const transferenciasEnviadas = bancodedados.transferencias.filter(transferencia => transferencia.numero_conta_origem === numero_conta);
     const transferenciasRecebidas = bancodedados.transferencias.filter(transferencia => transferencia.numero_conta_destino === numero_conta);

     return res.json({
         depositos,
         saques,
         transferenciasEnviadas,
         transferenciasRecebidas
     });
};
