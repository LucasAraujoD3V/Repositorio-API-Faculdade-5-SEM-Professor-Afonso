let token = localStorage.getItem('token') || '';
let alunosCache = [];

const formLogin = document.getElementById('formLogin');
const formAluno = document.getElementById('formAluno');
const listaAlunos = document.getElementById('listaAlunos');
const statusLogin = document.getElementById('statusLogin');
const statusServidor = document.getElementById('statusServidor');
const alunoId = document.getElementById('alunoId');
const nome = document.getElementById('nome');
const curso = document.getElementById('curso');

function atualizarStatusLogin() {
    statusLogin.textContent = token
        ? 'Autenticado'
        : 'Nao autenticado';
}

function cabecalhosProtegidos() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function tratarNaoAutorizado(resposta) {
    if (resposta.status === 401) {
        token = '';
        localStorage.removeItem('token');
        atualizarStatusLogin();
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
        alert(dados.mensagem || 'Falha no login');
        return;
    }

    token = dados.token;
    localStorage.setItem('token', token);
    atualizarStatusLogin();
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
        alert(alunos.mensagem || 'Erro ao carregar alunos');
        return;
    }

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
        botaoEditar.addEventListener('click', () => editarAluno(aluno._id));

        const botaoExcluir = document.createElement('button');
        botaoExcluir.textContent = 'Excluir';
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
        tratarNaoAutorizado(resposta);
        alert(dados.mensagem || 'Erro ao salvar');
        return;
    }

    limparFormulario();
    await carregarAlunos();
});

function editarAluno(id) {
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

    const resposta = await fetch(`/alunos/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        tratarNaoAutorizado(resposta);
        alert(dados.mensagem || 'Erro ao excluir');
        return;
    }

    await carregarAlunos();
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
