let token = localStorage.getItem('token') || '';
let alunosCache = [];

const formLogin = document.getElementById('formLogin');
const formAluno = document.getElementById('formAluno');
const listaAlunos = document.getElementById('listaAlunos');
const statusLogin = document.getElementById('statusLogin');
const tokenAtual = document.getElementById('tokenAtual');
const ultimaResposta = document.getElementById('ultimaResposta');
const statusServidor = document.getElementById('statusServidor');
const alunoId = document.getElementById('alunoId');
const nome = document.getElementById('nome');
const curso = document.getElementById('curso');

const textosStatus = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    404: 'Not Found',
    500: 'Internal Server Error'
};

function registrarResposta(metodo, url, resposta, mensagem) {
    const texto = textosStatus[resposta.status] || '';
    ultimaResposta.className = resposta.ok ? 'online' : 'offline';
    ultimaResposta.textContent =
        `${metodo} ${url} -> ${resposta.status} ${texto}` +
        (mensagem ? ` | ${mensagem}` : '');
}

function atualizarStatusLogin(mensagem, sucesso) {
    if (mensagem) {
        statusLogin.textContent = mensagem;
        statusLogin.className = sucesso ? 'online' : 'offline';
    }
    else {
        statusLogin.textContent = token ? 'Autenticado' : 'Nao autenticado';
        statusLogin.className = token ? 'online' : 'offline';
    }

    tokenAtual.textContent = token || 'nenhum';

    document.querySelectorAll('.acao').forEach((botao) => {
        botao.disabled = !token;
    });
}

function cabecalhosProtegidos() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function tratarNaoAutorizado(resposta, mensagem) {
    if (resposta.status === 401) {
        token = '';
        localStorage.removeItem('token');
        atualizarStatusLogin(`Erro 401: ${mensagem}`, false);
    }
}

async function verificarStatus() {
    try {
        const resposta = await fetch('/status');
        const dados = await resposta.json();
        statusServidor.className = dados.banco === 'conectado' ? 'online' : 'offline';
        statusServidor.textContent =
            `Servidor: ${dados.servidor} | Banco: ${dados.banco} | ` +
            `Porta: ${dados.porta} | Uptime: ${dados.uptimeSegundos}s`;
    }
    catch(error) {
        statusServidor.className = 'offline';
        statusServidor.textContent = 'Servidor offline';
    }
}

formLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const resposta = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            usuario: document.getElementById('usuario').value,
            senha: document.getElementById('senha').value
        })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        const mensagem = dados.mensagem || 'Falha no login';
        registrarResposta('POST', '/login', resposta, mensagem);
        token = '';
        localStorage.removeItem('token');
        atualizarStatusLogin(`Erro ${resposta.status}: ${mensagem}`, false);
        alert(`Erro ${resposta.status}: ${mensagem}`);
        return;
    }

    token = dados.token;
    localStorage.setItem('token', token);
    registrarResposta('POST', '/login', resposta, 'Token gerado');
    atualizarStatusLogin(`Autenticado (${resposta.status} ${textosStatus[resposta.status]})`, true);
});

document.getElementById('sair').addEventListener('click', () => {
    token = '';
    localStorage.removeItem('token');
    atualizarStatusLogin();
});

async function carregarAlunos() {
    const resposta = await fetch('/alunos');
    const alunos = await resposta.json();

    if (!resposta.ok) {
        const mensagem = alunos.mensagem || 'Erro ao carregar alunos';
        registrarResposta('GET', '/alunos', resposta, mensagem);
        alert(`Erro ${resposta.status}: ${mensagem}`);
        return;
    }

    registrarResposta('GET', '/alunos', resposta, `${alunos.length} aluno(s)`);
    alunosCache = alunos;
    listaAlunos.innerHTML = '';

    alunos.forEach((aluno) => {
        const linha = document.createElement('tr');

        const colunaNome = document.createElement('td');
        colunaNome.textContent = aluno.nome;

        const colunaCurso = document.createElement('td');
        colunaCurso.textContent = aluno.curso;

        const colunaAcoes = document.createElement('td');

        const botaoEditar = document.createElement('button');
        botaoEditar.textContent = 'Editar';
        botaoEditar.className = 'acao';
        botaoEditar.disabled = !token;
        botaoEditar.addEventListener('click', () => editarAluno(aluno._id));

        const botaoExcluir = document.createElement('button');
        botaoExcluir.textContent = 'Excluir';
        botaoExcluir.className = 'acao';
        botaoExcluir.disabled = !token;
        botaoExcluir.addEventListener('click', () => excluirAluno(aluno._id));

        colunaAcoes.append(botaoEditar, botaoExcluir);
        linha.append(colunaNome, colunaCurso, colunaAcoes);
        listaAlunos.appendChild(linha);
    });
}

formAluno.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (!token) {
        alert('Faca login antes de salvar.');
        return;
    }

    const dadosAluno = {
        nome: nome.value,
        curso: curso.value
    };

    const id = alunoId.value;
    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `/alunos/${id}` : '/alunos';

    const resposta = await fetch(url, {
        method: metodo,
        headers: cabecalhosProtegidos(),
        body: JSON.stringify(dadosAluno)
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        const mensagem = dados.mensagem || 'Erro ao salvar';
        registrarResposta(metodo, url, resposta, mensagem);
        tratarNaoAutorizado(resposta, mensagem);
        alert(`Erro ${resposta.status}: ${mensagem}`);
        return;
    }

    limparFormulario();
    await carregarAlunos();
    registrarResposta(metodo, url, resposta, id ? 'Aluno atualizado' : 'Aluno cadastrado');
});

function editarAluno(id) {
    if (!token) {
        alert('Faca login antes de editar.');
        return;
    }

    const aluno = alunosCache.find((item) => item._id === id);
    if (!aluno) return;

    alunoId.value = aluno._id;
    nome.value = aluno.nome;
    curso.value = aluno.curso;
}

async function excluirAluno(id) {
    if (!token) {
        alert('Faca login antes de excluir.');
        return;
    }

    const confirmou = confirm('Deseja realmente excluir este aluno?');
    if (!confirmou) return;

    const url = `/alunos/${id}`;
    const resposta = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        const mensagem = dados.mensagem || 'Erro ao excluir';
        registrarResposta('DELETE', url, resposta, mensagem);
        tratarNaoAutorizado(resposta, mensagem);
        alert(`Erro ${resposta.status}: ${mensagem}`);
        return;
    }

    await carregarAlunos();
    registrarResposta('DELETE', url, resposta, dados.mensagem);
}

function limparFormulario() {
    alunoId.value = '';
    nome.value = '';
    curso.value = '';
}

document
    .getElementById('cancelarEdicao')
    .addEventListener('click', limparFormulario);

document
    .getElementById('recarregar')
    .addEventListener('click', carregarAlunos);

document
    .getElementById('verificarStatus')
    .addEventListener('click', verificarStatus);

atualizarStatusLogin();
verificarStatus();
carregarAlunos();
