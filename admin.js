const API_URL = "https://jm-server.onrender.com";

carregarTabela();

const form = document.getElementById('form-produto');
form.addEventListener('submit', salvarProduto);

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

  if(id) { // Se tem ID é edição
    url = `${API_URL}/api/admin/produtos/${id}`;
    method = 'PUT';
  }

  const res = await fetch(url, {
    method,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(produto)
  });

  if(res.ok){
    alert('Produto salvo!');
    form.reset();
    document.getElementById('produto-id').value = '';
    carregarTabela();
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
  window.scrollTo(0,0); // sobe pro form
}

async function deletar(id) {
  if(!confirm('Tem certeza que quer excluir?')) return;
  await fetch(`${API_URL}/api/admin/produtos/${id}`, {method: 'DELETE'});
  alert('Produto excluído');
  carregarTabela();
}

function logout() {
  localStorage.removeItem('userJM');
  window.location.href = 'index.html';
}