const API_URL = window.location.hostname === 'localhost'
 ? 'http://localhost:3000'
  : 'https://jm-server.onrender.com'; // troca pela url do seu render

let usuarioLogado = JSON.parse(localStorage.getItem('userJM'));
let todosProdutos = [];
let categoriaAtiva = 'todos';

// EVENTOS DOS BOTOES
document.getElementById('link-cadastro').addEventListener('click', abrirCadastro);
document.getElementById('btn-cadastrar').addEventListener('click', cadastrar);

async function carregarProdutos() {
  try {
    document.getElementById('loading').style.display = 'block';
    const res = await fetch(`${API_URL}/api/produtos`);
    if(!res.ok) throw new Error("Erro: " + res.status);
    todosProdutos = await res.json();
    renderizarProdutos();
    document.getElementById('loading').style.display = 'none';
  } catch (error) {
    console.error("ERRO AO CARREGAR:", error);
    document.getElementById('loading').innerText = "Erro ao carregar produtos";
  }
}

function renderizarProdutos() {
  const lista = document.getElementById('lista-produtos');
  const filtrados = categoriaAtiva === 'todos' ? todosProdutos : todosProdutos.filter(p => p.categoria === categoriaAtiva);
  lista.innerHTML = filtrados.map(p => `
    <div class="produto">
      <img src="${p.imagem}">
      <div class="produto-info">
        <span class="tag">${p.categoria}</span>
        <h3>${p.nome}</h3>
        <p class="preco">${p.preco.toLocaleString('pt-AO')} KZ</p>
        <button class="btn" onclick='adicionarCarrinho(${JSON.stringify(p)})'>Adicionar</button>
      </div>
    </div>
  `).join('');
}

function filtrar(cat){ categoriaAtiva = cat; renderizarProdutos(); }

function adicionarCarrinho(produto) {
  if(!usuarioLogado) return abrirLogin();
  let carrinho = JSON.parse(localStorage.getItem('carrinhoJM')) || [];
  carrinho.push({...produto, quantidade: 1});
  localStorage.setItem('carrinhoJM', JSON.stringify(carrinho));
  atualizarContador();
  alert(`${produto.nome} adicionado!`);
}

function atualizarContador(){ document.getElementById('carrinho-count').innerText = JSON.parse(localStorage.getItem('carrinhoJM'))?.length || 0; }
function abrirCarrinho(){ document.getElementById('modal-carrinho').style.display = 'block'; renderizarCarrinho(); }
function fecharCarrinho(){ document.getElementById('modal-carrinho').style.display = 'none'; }
function abrirLogin(){ document.getElementById('modal-login').style.display = 'block'; }
function fecharLogin(){ document.getElementById('modal-login').style.display = 'none'; }
function abrirCadastro(){ fecharLogin(); document.getElementById('modal-cadastro').style.display = 'block'; }
function fecharCadastro(){ document.getElementById('modal-cadastro').style.display = 'none'; }

async function login(){
  const email = document.getElementById('email-login').value;
  const senha = document.getElementById('senha-login').value;
  const res = await fetch(`${API_URL}/api/login`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email, senha})});
  const data = await res.json();
  if(data.user){ localStorage.setItem('userJM', JSON.stringify(data.user)); location.reload(); } else alert(data.error);
}

async function cadastrar(){
  const email = document.getElementById('email-cadastro').value;
  const password = document.getElementById('senha-cadastro').value;
  const res = await fetch(`${API_URL}/api/register`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email, password})});
  const data = await res.json();
  if(res.ok){ alert('Cadastrado! Faça login'); fecharCadastro(); abrirLogin(); } else alert(data.error);
}

function renderizarCarrinho() { /* cola seu código do carrinho aqui */ }

async function finalizar(){
  const carrinho = JSON.parse(localStorage.getItem('carrinhoJM'));
  const res = await fetch(`${API_URL}/api/checkout`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({usuario_id: usuarioLogado.id, itens: carrinho})});
  const data = await res.json();
  localStorage.removeItem('carrinhoJM');
  window.location.href = data.link; 
}

carregarProdutos(); atualizarContador();


