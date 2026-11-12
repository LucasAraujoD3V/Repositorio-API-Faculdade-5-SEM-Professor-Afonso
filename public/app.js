let token = localStorage.getItem('token') || '';
let tecnologiasCache = [];

const log = document.getElementById('log');
const tokenAtual = document.getElementById('tokenAtual');
const statusServidor = document.getElementById('statusServidor');
const listaTecnologias = document.getElementById('listaTecnologias');
const tituloForm = document.getElementById('tituloForm');
const tecnologiaId = document.getElementById('tecnologiaId');
const nome = document.getElementById('nome');
const base = document.getElementById('base');
const curvaAprendizado = document.getElementById('curvaAprendizado');

const textosStatus = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Internal Server Error'
};

// Mostra cada requisicao na tela: metodo, url, status, SUCESSO/ERRO e a resposta
function registrar(metodo, url, status, sucesso, dados) {
    const item = document.createElement('li');
    item.className = sucesso ? 'sucesso' : 'erro';

    const titulo = document.createElement('strong');
    titulo.textContent =
        `${new Date().toLocaleTimeString()} | ${metodo} ${url} -> ` +
        `${status} ${textosStatus[status] || ''} | ${sucesso ? 'SUCESSO' : 'ERRO'}`;

    const resposta = document.createElement('pre');
    resposta.textContent = JSON.stringify(dados, null, 2);

    item.append(titulo, resposta);
    log.prepend(item);
}

// Faz a requisicao para a API (manda o token se tiver) e registra o resultado
async function chamarApi(metodo, url, corpo) {
    const opcoes = {
        method: metodo,
        headers: { 'Content-Type': 'application/json' }
    };

    if (token) opcoes.headers['Authorization'] = `Bearer ${token}`;
    if (corpo) opcoes.body = JSON.stringify(corpo);

    try {
        const resposta = await fetch(url, opcoes);
        const dados = await resposta.json();
        registrar(metodo, url, resposta.status, resposta.ok, dados);

        if (resposta.status === 401) {
            token = '';
            localStorage.removeItem('token');
            mostrarToken();
        }

        return { ok: resposta.ok, dados };
    }
    catch(error) {
        registrar(metodo, url, 0, false, { mensagem: 'Servidor offline' });
        return { ok: false, dados: {} };
    }
}

function mostrarToken() {
    tokenAtual.textContent = token || 'nenhum (faca login para cadastrar, editar e excluir)';
}

async function verificarStatus() {
    const resposta = await chamarApi('GET', '/status');
    const dados = resposta.dados;

    statusServidor.className = dados.banco === 'conectado' ? 'online' : 'offline';
    statusServidor.textContent = resposta.ok
        ? `Servidor: ${dados.servidor} | Banco: ${dados.banco} | Porta: ${dados.porta}`
        : 'Servidor offline';
}

document.getElementById('formLogin').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const resposta = await chamarApi('POST', '/login', {
        usuario: document.getElementById('usuario').value,
        senha: document.getElementById('senha').value
    });

    if (resposta.ok) {
        token = resposta.dados.token;
        localStorage.setItem('token', token);
    }
    mostrarToken();
});

document.getElementById('sair').addEventListener('click', () => {
    token = '';
    localStorage.removeItem('token');
    mostrarToken();
});

async function carregarTecnologias() {
    const resposta = await chamarApi('GET', '/tecnologias');
    if (!resposta.ok) return;

    tecnologiasCache = resposta.dados;
    listaTecnologias.innerHTML = '';

    tecnologiasCache.forEach((tecnologia) => {
        const linha = document.createElement('tr');

        const colunaNome = document.createElement('td');
        colunaNome.textContent = tecnologia.nome;

        const colunaBase = document.createElement('td');
        colunaBase.textContent = tecnologia.base;

        const colunaCurva = document.createElement('td');
        colunaCurva.textContent = tecnologia.curvaAprendizado;

        const colunaAcoes = document.createElement('td');

        const botaoEditar = document.createElement('button');
        botaoEditar.textContent = 'Editar';
        botaoEditar.addEventListener('click', () => editarTecnologia(tecnologia._id));

        const botaoExcluir = document.createElement('button');
        botaoExcluir.textContent = 'Excluir';
        botaoExcluir.addEventListener('click', () => excluirTecnologia(tecnologia._id));

        colunaAcoes.append(botaoEditar, botaoExcluir);
        linha.append(colunaNome, colunaBase, colunaCurva, colunaAcoes);
        listaTecnologias.appendChild(linha);
    });
}

// Salvar: POST se for nova, PUT se estiver editando
document.getElementById('formTecnologia').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const dados = {
        nome: nome.value,
        base: base.value,
        curvaAprendizado: curvaAprendizado.value
    };

    const id = tecnologiaId.value;
    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `/tecnologias/${id}` : '/tecnologias';

    const resposta = await chamarApi(metodo, url, dados);

    if (resposta.ok) {
        limparFormulario();
        carregarTecnologias();
    }
});

function editarTecnologia(id) {
    const tecnologia = tecnologiasCache.find((item) => item._id === id);
    if (!tecnologia) return;

    tecnologiaId.value = tecnologia._id;
    nome.value = tecnologia.nome;
    base.value = tecnologia.base;
    curvaAprendizado.value = tecnologia.curvaAprendizado;
    tituloForm.textContent = `Editando: ${tecnologia.nome}`;
}

async function excluirTecnologia(id) {
    if (!confirm('Deseja realmente excluir esta tecnologia?')) return;

    const resposta = await chamarApi('DELETE', `/tecnologias/${id}`);
    if (resposta.ok) carregarTecnologias();
}

function limparFormulario() {
    tecnologiaId.value = '';
    nome.value = '';
    base.value = '';
    curvaAprendizado.value = '';
    tituloForm.textContent = 'Nova tecnologia';
}

document.getElementById('cancelarEdicao').addEventListener('click', limparFormulario);
document.getElementById('recarregar').addEventListener('click', carregarTecnologias);
document.getElementById('verificarStatus').addEventListener('click', verificarStatus);
document.getElementById('limparLog').addEventListener('click', () => { log.innerHTML = ''; });

mostrarToken();
verificarStatus();
carregarTecnologias();
