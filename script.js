const API_URL = window.location.hostname === 'localhost'
 ? 'http://localhost:3000'
  : 'https://jm-server.onrender.com'; // TROCA PELA URL DO TEU RENDER

let produtos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinhoJM')) || [];
let usuarioLogado = JSON.parse(localStorage.getItem('userJM')) || null;

document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  atualizarContadorCarrinho();
  verificarLogin();
  renderizarCarrinho(); // Renderiza o carrinho ao carregar a página
});

// MODAIS LOGIN/CADASTRO
const modalAuth = document.getElementById('modalAuth');
const btnAbrirLogin = document.getElementById('btnAbrirLogin');
const btnFecharModal = document.getElementById('btnFecharModal');
const formAuth = document.getElementById('formAuth');
const btnTrocarForm = document.getElementById('btnTrocarForm');

btnAbrirLogin?.addEventListener('click', () => modalAuth.style.display = 'flex');
btnFecharModal?.addEventListener('click', () => modalAuth.style.display = 'none');

let isCadastro = false;
btnTrocarForm?.addEventListener('click', () => {
  isCadastro = !isCadastro;
  document.getElementById('tituloAuth').innerText = isCadastro ? 'Cadastre-se' : 'Login';
  document.getElementById('btnSubmitAuth').innerText = isCadastro ? 'Cadastrar' : 'Entrar';
  btnTrocarForm.innerHTML = isCadastro ? 'Já tem conta? <b>Faça Login</b>' : 'Não tem conta? <b>Cadastre-se</b>';
});

formAuth?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value; // Usando "senha" pra bater com o server
  const url = isCadastro ? '/api/register' : '/api/login';

  const res = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }) // Envia como "senha"
  });

  const data = await res.json();
  if (res.ok) {
    alert(data.msg);
    if (!isCadastro) { // Se for login
      usuarioLogado = data.user;
      localStorage.setItem('userJM', JSON.stringify(usuarioLogado));
      verificarLogin();
      modalAuth.style.display = 'none';
    }
  } else {
    alert(data.error);
  }
});

function verificarLogin() {
  const areaUsuario = document.getElementById('areaUsuario');
  const btnAdmin = document.getElementById('btnAdmin');
  if (usuarioLogado) {
    areaUsuario.innerHTML = `<span>Olá, ${usuarioLogado.email.split('@')[0]}</span> <button onclick="logout()">Sair</button>`;
    
    // MOSTRA BOTÃO ADMIN SÓ PRA ESSE EMAIL
    if (usuarioLogado.email === 'miguelpjunior18@gmail.com') { // TROCA PELO TEU EMAIL DE ADMIN
      btnAdmin.style.display = 'block';
    }
  }
}

function logout() {
  localStorage.removeItem('userJM');
  usuarioLogado = null;
  document.getElementById('btnAdmin').style.display = 'none';
  document.getElementById('areaUsuario').innerHTML = `<button id="btnAbrirLogin">Entrar</button>`;
  document.getElementById('btnAbrirLogin').addEventListener('click', () => modalAuth.style.display = 'flex');
}

// PRODUTOS
async function carregarProdutos() {
  const res = await fetch(`${API_URL}/api/produtos`);
  produtos = await res.json();
  renderizarProdutos(produtos);
}

function renderizarProdutos(lista) {
  const grid = document.getElementById('produtos-grid');
  grid.innerHTML = lista.map(p => `
    <div class="card-produto">
      <img src="${p.imagem}" alt="${p.nome}">
      <h3>${p.nome}</h3>
      <p class="preco">${p.preco.toLocaleString('pt-PT')} KZ</p>
      <button class="btn-add" onclick='adicionarAoCarrinho(${JSON.stringify(p)})'>Adicionar</button>
    </div>
  `).join('');
}

// CARRINHO
function adicionarAoCarrinho(produto) {
  const itemNoCarrinho = carrinho.find(i => i.id === produto.id);
  if (itemNoCarrinho) {
    itemNoCarrinho.quantidade++;
  } else {
    carrinho.push({ ...produto, quantidade: 1 });
  }
  localStorage.setItem('carrinhoJM', JSON.stringify(carrinho));
  atualizarContadorCarrinho();
  renderizarCarrinho(); // ATUALIZA A LISTA DO CARRINHO
  alert(`${produto.nome} adicionado!`);
}

function renderizarCarrinho() {
  const carrinhoItens = document.getElementById('carrinhoItens');
  const totalCarrinho = document.getElementById('totalCarrinho');
  
  if (!carrinhoItens) return; // Se não estiver na página

  if (carrinho.length === 0) {
    carrinhoItens.innerHTML = '<p style="text-align:center; padding: 20px;">Carrinho vazio</p>';
  } else {
    carrinhoItens.innerHTML = carrinho.map(item => `
      <div class="item-carrinho">
        <img src="${item.imagem}" alt="${item.nome}">
        <div class="item-info">
          <p><b>${item.nome}</b></p>
          <p>${item.preco.toLocaleString('pt-PT')} KZ x ${item.quantidade}</p>
        </div>
        <button class="btn-remover" onclick="removerDoCarrinho(${item.id})">X</button>
      </div>
    `).join('');
  }
  
  const total = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
  totalCarrinho.innerText = total.toLocaleString('pt-PT') + ' KZ';
}

function removerDoCarrinho(id) {
  carrinho = carrinho.filter(i => i.id !== id);
  localStorage.setItem('carrinhoJM', JSON.stringify(carrinho));
  renderizarCarrinho();
  atualizarContadorCarrinho();
}

function atualizarContadorCarrinho() {
  const totalItens = carrinho.reduce((s, i) => s + i.quantidade, 0);
  document.getElementById('contadorCarrinho').innerText = totalItens;
}

function toggleCarrinho() {
  document.getElementById('carrinhoSidebar').classList.toggle('aberto');
}

// CHECKOUT
async function finalizarCompra() {
  if (!usuarioLogado) {
    alert('Faça login para finalizar a compra');
    return modalAuth.style.display = 'flex';
  }
  if (carrinho.length === 0) {
    alert('Seu carrinho está vazio');
    return;
  }

  const res = await fetch(`${API_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario_id: usuarioLogado.id, itens: carrinho })
  });

  const data = await res.json();
  if (res.ok) {
    window.open(data.link, '_blank'); // Abre WhatsApp
    carrinho = [];
    localStorage.removeItem('carrinhoJM');
    renderizarCarrinho();
    atualizarContadorCarrinho();
    toggleCarrinho();
  } else {
    alert('Erro ao finalizar pedido');
  }
}