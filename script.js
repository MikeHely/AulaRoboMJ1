const API_URL = "https://jm-server.onrender.com"; // TROCA PELA URL DO RENDER
let usuarioLogado = JSON.parse(localStorage.getItem('userJM'));
let todosProdutos = [];
let categoriaAtiva = 'todos';

async function carregarProdutos() {
  const res = await fetch(`${API_URL}/api/produtos`);
  todosProdutos = await res.json();
  renderizarProdutos();
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
function abrirCarrinho(){ /* ...código do modal igual anterior... */ }
function fecharCarrinho(){ document.getElementById('modal-carrinho').style.display = 'none'; }
function abrirLogin(){ document.getElementById('modal-login').style.display = 'block'; }
function fecharLogin(){ document.getElementById('modal-login').style.display = 'none'; }

async function login(){
  const res = await fetch(`${API_URL}/api/login`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:email.value, senha:senha.value})});
  const data = await res.json();
  if(data.user){ localStorage.setItem('userJM', JSON.stringify(data.user)); location.reload(); } else alert(data.error);
}

async function finalizar(){
  const carrinho = JSON.parse(localStorage.getItem('carrinhoJM'));
  const res = await fetch(`${API_URL}/api/checkout`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({usuario_id: usuarioLogado.id, itens: carrinho})});
  const data = await res.json();
  localStorage.removeItem('carrinhoJM');
  window.location.href = data.link; 
}

carregarProdutos(); atualizarContador();