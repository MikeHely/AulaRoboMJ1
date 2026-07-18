const API_URL = window.location.hostname === 'localhost'
 ? 'http://localhost:3000'
  : 'https://jm-server.onrender.com'; // troca pela url do seu render

let usuarioLogado = JSON.parse(localStorage.getItem('userJM'));
let tokenJM = localStorage.getItem('tokenJM');
let todosProdutos = [];
let categoriaAtiva = 'todos';
let carrinho = JSON.parse(localStorage.getItem('carrinhoJM')) || []; // 1. DECLARAR O CARRINHO AQUI

// EVENTOS DOS BOTOES
document.getElementById('link-cadastro').addEventListener('click', abrirCadastro);
document.getElementById('btn-cadastrar').addEventListener('click', cadastrar);
document.getElementById('btn-login')?.addEventListener('click', login); // Adicionei pra garantir
document.getElementById('btn-finalizar')?.addEventListener('click', finalizar); // Adicionei pra garantir

// MOSTRA BOTÃO ADMIN SE O SERVIDOR CONFIRMAR is_admin (não confia só no frontend)
document.addEventListener('DOMContentLoaded', () => {
  if(usuarioLogado && usuarioLogado.is_admin){
    document.getElementById('btn-admin') && (document.getElementById('btn-admin').style.display = 'inline-block');
  }
  atualizarContador();
});

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
        <p class="preco">${p.preco.toLocaleString('pt-PT')} KZ</p> 
        <button class="btn" onclick='adicionarCarrinho(${JSON.stringify(p)})'>Adicionar</button>
      </div>
    </div>
  `).join('');
}

function filtrar(cat){ categoriaAtiva = cat; renderizarProdutos(); }

// 2. FUNÇÃO PRA ADICIONAR QUE FALTAVA
function adicionarCarrinho(produto){
  const item = carrinho.find(i => i.id === produto.id);
  if(item){ item.quantidade++; } 
  else { carrinho.push({...produto, quantidade: 1}); }
  localStorage.setItem('carrinhoJM', JSON.stringify(carrinho));
  atualizarContador();
  alert(produto.nome + ' adicionado ao carrinho!');
}

function renderizarCarrinho(){
  const carrinhoItens = document.getElementById('carrinhoItens');
  const totalCarrinho = document.getElementById('totalCarrinho');
  
  if(carrinho.length === 0){
    carrinhoItens.innerHTML = '<p style="text-align:center; padding: 20px;">Carrinho vazio</p>';
  } else {
    carrinhoItens.innerHTML = carrinho.map(item => `
      <div class="item-carrinho">
        <img src="${item.imagem}" alt="${item.nome}" width="50">
        <div class="item-info">
          <p><b>${item.nome}</b></p>
          <p>${item.preco.toLocaleString('pt-PT')} KZ x ${item.quantidade}</p>
        </div>
        <button onclick="removerDoCarrinho(${item.id})">X</button>
      </div>
    `).join('');
  }
  
  const total = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
  totalCarrinho.innerText = total.toLocaleString('pt-PT') + ' KZ';
}

function removerDoCarrinho(id){
  carrinho = carrinho.filter(i => i.id !== id);
  localStorage.setItem('carrinhoJM', JSON.stringify(carrinho));
  renderizarCarrinho();
  atualizarContador();
}

// 3. CORRIGI O CONTADOR: AGORA SOMA A QUANTIDADE E NÃO SÓ OS ITENS
function atualizarContador(){ 
  const totalItens = carrinho.reduce((s, i) => s + i.quantidade, 0);
  document.getElementById('carrinho-count').innerText = totalItens; 
}

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
  if(data.user && data.token){ 
    localStorage.setItem('userJM', JSON.stringify(data.user)); 
    localStorage.setItem('tokenJM', data.token);
    location.reload(); 
  } else alert(data.error);
}

async function cadastrar(){
  const email = document.getElementById('email-cadastro').value;
  const password = document.getElementById('senha-cadastro').value;
  const res = await fetch(`${API_URL}/api/register`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email, password})});
  const data = await res.json();
  if(res.ok){ alert('Cadastrado! Faça login'); fecharCadastro(); abrirLogin(); } else alert(data.error);
}

// 4. FINALIZAR COM CHECK DE LOGIN E LIMPAR CARRINHO
async function finalizar(){
  if(!usuarioLogado){ alert('Faça login para finalizar'); return abrirLogin(); }
  if(carrinho.length === 0){ alert('Carrinho vazio'); return; }

  const res = await fetch(`${API_URL}/api/checkout`, {
    method:'POST',
    headers:{'Content-Type':'application/json', 'Authorization': `Bearer ${tokenJM}`},
    body:JSON.stringify({itens: carrinho})
  });
  const data = await res.json();
  
  if(res.ok){
    localStorage.removeItem('carrinhoJM');
    carrinho = [];
    fecharCarrinho();
    window.location.href = data.link; 
  } else {
    alert('Erro ao finalizar');
  }
}

carregarProdutos(); atualizarContador();