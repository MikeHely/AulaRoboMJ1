const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://jm-server.onrender.com';

// ===== PROTEÇÃO DA PÁGINA =====
const usuarioLogado = JSON.parse(localStorage.getItem('userJM'));
const token = localStorage.getItem('tokenJM');

if (!usuarioLogado || !token || !usuarioLogado.is_admin) {
  alert('Acesso restrito. Faça login como administrador.');
  window.location.href = 'index.html';
}

carregarTabela();

const form = document.getElementById('form-produto');
form.addEventListener('submit', salvarProduto);

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function carregarTabela() {
  const res = await fetch(`${API_URL}/api/produtos`);
  const produtos = await res.json();
  const tbody = document.getElementById('tabela-body');

  tbody.innerHTML = produtos.map(p => `
    <tr>
      <td><img src="${p.imagem}" alt="${p.nome}"></td>
      <td>${p.nome}</td>
      <td>${p.preco.toLocaleString('pt-AO')} KZ</td>
      <td><span class="tag">${p.categoria}</span></td>
      <td class="acoes">
        <button class="btn btn-edit btn-sm" onclick='editar(${JSON.stringify(p)})'>Editar</button>
        <button class="btn btn-danger btn-sm" onclick='deletar(${p.id})'>Excluir</button>
      </td>
    </tr>
  `).join('');
}

async function salvarProduto(e) {
  e.preventDefault();
  const id = document.getElementById('produto-id').value;
  const produto = {
    nome: document.getElementById('nome').value,
    preco: Number(document.getElementById('preco').value),
    categoria: document.getElementById('categoria').value,
    imagem: document.getElementById('imagem').value
  };

  let url = `${API_URL}/api/admin/produtos`;
  let method = 'POST';

  if(id) {
    url = `${API_URL}/api/admin/produtos/${id}`;
    method = 'PUT';
  }

  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: JSON.stringify(produto)
  });

  if(res.ok){
    alert('Produto salvo!');
    form.reset();
    document.getElementById('produto-id').value = '';
    carregarTabela();
  } else if (res.status === 401 || res.status === 403) {
    alert('Sessão expirada ou sem permissão. Faça login novamente.');
    logout();
  } else {
    alert('Erro ao salvar');
  }
}

function editar(produto) {
  document.getElementById('produto-id').value = produto.id;
  document.getElementById('nome').value = produto.nome;
  document.getElementById('preco').value = produto.preco;
  document.getElementById('categoria').value = produto.categoria;
  document.getElementById('imagem').value = produto.imagem;
  window.scrollTo(0,0);
}

async function deletar(id) {
  if(!confirm('Tem certeza que quer excluir?')) return;
  const res = await fetch(`${API_URL}/api/admin/produtos/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (res.ok) {
    alert('Produto excluído');
    carregarTabela();
  } else if (res.status === 401 || res.status === 403) {
    alert('Sessão expirada ou sem permissão. Faça login novamente.');
    logout();
  } else {
    alert('Erro ao excluir');
  }
}

function logout() {
  localStorage.removeItem('userJM');
  localStorage.removeItem('tokenJM');
  window.location.href = 'index.html';
}
