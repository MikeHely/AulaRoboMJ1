
let usuarioLogado = JSON.parse(localStorage.getItem('userJM'));
let tokenJM = localStorage.getItem('tokenJM');
let todosProdutos = [];
let categoriaAtiva = 'todos';
let carrinho = [];
let sessionId = localStorage.getItem('sessionId') || `sessao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const API_URL = 'https://jm-server.onrender.com';

localStorage.setItem('sessionId', sessionId);

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
  await carregarCategorias();
  await carregarProdutos();
  atualizarUIUsuario();
  
  if (usuarioLogado && tokenJM) {
    await carregarCarrinhoServidor();
  }
  atualizarContador();
  
  // Event listeners
  document.getElementById('link-cadastro').addEventListener('click', (e) => {
    e.preventDefault();
    fecharLogin();
    abrirCadastro();
  });
  
  document.getElementById('link-login').addEventListener('click', (e) => {
    e.preventDefault();
    fecharCadastro();
    abrirLogin();
  });
  
  document.getElementById('btn-cadastrar').addEventListener('click', cadastrar);
  
  document.getElementById('senha-login').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
  });
});


function abrirCarrinho() {
  document.getElementById('modal-carrinho').style.display = 'block';
  renderizarCarrinho();
  
  // REGISTRA QUE O USUÁRIO ABRIU O CARRINHO
  registrarCheckout();
}

function fecharCarrinho() {
  document.getElementById('modal-carrinho').style.display = 'none';
}


document.addEventListener('DOMContentLoaded', async () => {
  // Carrega produtos e categorias
  await carregarCategorias();
  await carregarProdutos();
  
  // RESTAURA A SESSÃO
  atualizarUIUsuario(); // ← ESSENCIAL!
  
  if (usuarioLogado && tokenJM) {
    await carregarCarrinhoServidor();
  }
  atualizarContador();
  
  // Event listeners...
});

// ===== CATEGORIAS =====
async function carregarCategorias() {
  try {
    const res = await fetch(`${API_URL}/api/categorias`);
    const categorias = await res.json();
    const container = document.getElementById('filtros-categorias');
    container.innerHTML = `<button onclick="filtrar('todos')" class="ativo">Todos</button>`;
    categorias.forEach(cat => {
      container.innerHTML += `<button onclick="filtrar('${cat}')">${capitalizar(cat)}</button>`;
    });
  } catch (error) {
    console.error('Erro carregar categorias:', error);
  }
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

async function cadastrar() {
  const nome = document.getElementById('nome-cadastro').value;
  const email = document.getElementById('email-cadastro').value;
  const telefone = document.getElementById('telefone-cadastro').value;
  const regiao = document.getElementById('regiao-cadastro').value;
  const senha = document.getElementById('senha-cadastro').value;
  
  // VALIDAÇÃO
  if (!nome || !email || !telefone || !regiao || !senha) {
    alert('⚠️ Preencha todos os campos!');
    return;
  }
  
  if (senha.length < 6) {
    alert('⚠️ A senha deve ter pelo menos 6 caracteres!');
    return;
  }
  
  // MOSTRAR O QUE ESTÁ SENDO ENVIADO
  console.log('📝 Enviando cadastro:', { nome, email, telefone, regiao, password: senha });
  
  try {
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nome, 
        email, 
        telefone, 
        regiao, 
        password: senha 
      })
    });
    
    const data = await res.json();
    console.log('📝 Resposta:', data);
    
    if (res.ok) {
      alert('✅ Cadastro realizado! Faça login.');
      fecharCadastro();
      abrirLogin();
      document.getElementById('email-login').value = email;
    } else {
      alert('❌ ' + (data.error || 'Erro ao cadastrar'));
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    alert('❌ Erro de conexão com o servidor');
  }
}


// ===== PRODUTOS =====
async function carregarProdutos() {
  try {
    const res = await fetch(`${API_URL}/api/produtos`);
    if (!res.ok) throw new Error("Erro: " + res.status);
    todosProdutos = await res.json();
    renderizarProdutos();
    document.getElementById('loading').style.display = 'none';
  } catch (error) {
    console.error("ERRO:", error);
    document.getElementById('loading').innerText = "Erro ao carregar produtos";
  }
}

function renderizarProdutos() {
  const lista = document.getElementById('lista-produtos');
  const filtrados = categoriaAtiva === 'todos' 
    ? todosProdutos 
    : todosProdutos.filter(p => p.categoria === categoriaAtiva);
  
  if (filtrados.length === 0) {
    lista.innerHTML = '<p style="text-align:center; padding:40px;">Nenhum produto encontrado</p>';
    return;
  }
  
  lista.innerHTML = filtrados.map(p => `
    <div class="produto">
      <img src="${p.imagem}" alt="${p.nome}" loading="lazy">
      <div class="produto-info">
        <span class="tag">${capitalizar(p.categoria)}</span>
        <h3>${p.nome}</h3>
        <p class="preco">${p.preco.toLocaleString('pt-PT')} KZ</p>
        <button class="btn" onclick='adicionarCarrinho(${JSON.stringify(p)})'>🛒 Adicionar</button>
      </div>
    </div>
  `).join('');
}

function filtrar(cat) {
  categoriaAtiva = cat;
  document.querySelectorAll('.filtros button').forEach(btn => {
    btn.classList.toggle('ativo', btn.textContent.toLowerCase() === cat || 
      (cat === 'todos' && btn.textContent === 'Todos'));
  });
  renderizarProdutos();
}

// script.js - Mostra o botão se for admin
if (usuarioLogado && usuarioLogado.is_admin) {
  document.getElementById('btn-admin').style.display = 'inline-block';
}

// ===== USUÁRIO =====
function atualizarUIUsuario() {
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const btnPerfil = document.getElementById('btn-perfil');
  const btnAdmin = document.getElementById('btn-admin');
  const userNome = document.getElementById('user-nome');
  
  if (usuarioLogado) {
    btnLogin.style.display = 'none';
    btnLogout.style.display = 'inline-block';
    btnPerfil.style.display = 'inline-block';
    userNome.textContent = `👋 ${usuarioLogado.nome || 'Usuário'}`;
    
    if (usuarioLogado.is_admin) {
      btnAdmin.style.display = 'inline-block';
    }
  } else {
    btnLogin.style.display = 'inline-block';
    btnLogout.style.display = 'none';
    btnPerfil.style.display = 'none';
    btnAdmin.style.display = 'none';
    userNome.textContent = '';
  }
}

// ===== LOGIN / CADASTRO =====
async function login() {
  const email = document.getElementById('email-login').value;
  const senha = document.getElementById('senha-login').value;
  
  if (!email || !senha) {
    alert('Preencha todos os campos');
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    
    const data = await res.json();
    
    if (res.ok && data.user && data.token) {
      localStorage.setItem('userJM', JSON.stringify(data.user));
      localStorage.setItem('tokenJM', data.token);
      usuarioLogado = data.user;
      tokenJM = data.token;
      fecharLogin();
      atualizarUIUsuario();
      await carregarCarrinhoServidor();
      atualizarContador();
      mostrarToast(`Bem-vindo, ${data.user.nome || 'Usuário'}!`);
    } else {
      alert(data.error || 'Erro ao fazer login');
    }
  } catch (error) {
    alert('Erro de conexão');
  }
}

async function cadastrar() {
  const nome = document.getElementById('nome-cadastro').value;
  const email = document.getElementById('email-cadastro').value;
  const telefone = document.getElementById('telefone-cadastro').value;
  const regiao = document.getElementById('regiao-cadastro').value;
  const senha = document.getElementById('senha-cadastro').value;
  
  if (!nome || !email || !telefone || !regiao || !senha) {
    alert('Preencha todos os campos');
    return;
  }
  
  if (senha.length < 6) {
    alert('A senha deve ter pelo menos 6 caracteres');
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, telefone, regiao, password: senha })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      alert('✅ Cadastro realizado com sucesso! Faça login.');
      fecharCadastro();
      abrirLogin();
      document.getElementById('email-login').value = email;
    } else {
      alert(data.error || 'Erro ao cadastrar');
    }
  } catch (error) {
    alert('Erro de conexão');
  }
}

function logout() {
  localStorage.removeItem('userJM');
  localStorage.removeItem('tokenJM');
  usuarioLogado = null;
  tokenJM = null;
  carrinho = [];
  atualizarUIUsuario();
  atualizarContador();
  mostrarToast('Logout realizado');
}

// ===== PERFIL =====
async function abrirPerfil() {
  if (!usuarioLogado) return;
  
  try {
    const res = await fetch(`${API_URL}/api/usuario/perfil`, {
      headers: { 'Authorization': `Bearer ${tokenJM}` }
    });
    const data = await res.json();
    
    document.getElementById('perfil-nome').textContent = data.nome;
    document.getElementById('perfil-email').textContent = data.email;
    document.getElementById('perfil-telefone').textContent = data.telefone;
    document.getElementById('perfil-regiao').textContent = data.regiao || 'Não informado';
    document.getElementById('perfil-data').textContent = new Date(data.data_cadastro).toLocaleDateString('pt-PT');
    
    document.getElementById('modal-perfil').style.display = 'block';
    document.getElementById('perfil-pedidos').style.display = 'none';
  } catch (error) {
    alert('Erro ao carregar perfil');
  }
}

function fecharPerfil() {
  document.getElementById('modal-perfil').style.display = 'none';
}

function abrirEditarPerfil() {
  const nome = document.getElementById('perfil-nome').textContent;
  const telefone = document.getElementById('perfil-telefone').textContent;
  const regiao = document.getElementById('perfil-regiao').textContent;
  
  document.getElementById('editar-nome').value = nome;
  document.getElementById('editar-telefone').value = telefone;
  document.getElementById('editar-regiao').value = regiao === 'Não informado' ? '' : regiao;
  
  document.getElementById('modal-editar-perfil').style.display = 'block';
}

function fecharEditarPerfil() {
  document.getElementById('modal-editar-perfil').style.display = 'none';
}

async function salvarPerfil() {
  const nome = document.getElementById('editar-nome').value;
  const telefone = document.getElementById('editar-telefone').value;
  const regiao = document.getElementById('editar-regiao').value;
  
  try {
    const res = await fetch(`${API_URL}/api/usuario/perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenJM}`
      },
      body: JSON.stringify({ nome, telefone, regiao })
    });
    
    if (res.ok) {
      const data = await res.json();
      usuarioLogado = { ...usuarioLogado, nome, telefone, regiao };
      localStorage.setItem('userJM', JSON.stringify(usuarioLogado));
      atualizarUIUsuario();
      fecharEditarPerfil();
      abrirPerfil();
      mostrarToast('Perfil atualizado!');
    } else {
      alert('Erro ao atualizar perfil');
    }
  } catch (error) {
    alert('Erro de conexão');
  }
}

async function verPedidos() {
  const container = document.getElementById('perfil-pedidos');
  
  if (container.style.display === 'block') {
    container.style.display = 'none';
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/api/pedidos`, {
      headers: { 'Authorization': `Bearer ${tokenJM}` }
    });
    const pedidos = await res.json();
    
    if (pedidos.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:#666;">Nenhum pedido ainda</p>';
    } else {
      container.innerHTML = pedidos.map(p => `
        <div style="border:1px solid #ddd; border-radius:8px; padding:15px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>#${p.id}</strong>
            <span style="padding:3px 10px; border-radius:12px; font-size:12px; 
              ${p.status === 'Pendente' ? 'background:#FEF3C7; color:#92400E;' : 
                p.status === 'Enviado' ? 'background:#D1FAE5; color:#065F46;' : 
                'background:#E5E7EB; color:#374151;'}">
              ${p.status}
            </span>
          </div>
          <p style="font-size:14px; color:#666;">
            ${new Date(p.data_pedido).toLocaleDateString('pt-PT')} - 
            ${p.itens_pedido?.length || 0} itens
          </p>
          <p style="font-weight:bold; color:var(--cor-preco);">
            ${p.total.toLocaleString('pt-PT')} KZ
          </p>
          <details>
            <summary style="cursor:pointer; color:var(--cor-principal); font-size:14px;">Ver detalhes</summary>
            ${p.itens_pedido?.map(item => `
              <div style="display:flex; gap:10px; padding:5px 0; border-bottom:1px solid #f0f0f0; font-size:14px;">
                <span>${item.produtos?.nome || 'Produto'}</span>
                <span>x${item.quantidade}</span>
                <span style="margin-left:auto;">${(item.preco_unitario * item.quantidade).toLocaleString('pt-PT')} KZ</span>
              </div>
            `).join('') || ''}
          </details>
        </div>
      `).join('');
    }
    
    container.style.display = 'block';
  } catch (error) {
    alert('Erro ao carregar pedidos');
  }
}

// ===== CARRINHO =====
async function carregarCarrinhoServidor() {
  try {
    const res = await fetch(`${API_URL}/api/carrinho`, {
      headers: { 'Authorization': `Bearer ${tokenJM}` }
    });
    
    if (res.ok) {
      const itens = await res.json();
      carrinho = itens.map(item => ({
        ...item,
        preco: Number(item.preco)
      }));
      localStorage.setItem('carrinhoJM', JSON.stringify(carrinho));
      atualizarContador();
    }
  } catch (error) {
    console.error('Erro carregar carrinho:', error);
  }
}

async function salvarCarrinhoServidor() {
  if (!usuarioLogado) return;
  
  try {
    await fetch(`${API_URL}/api/carrinho`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenJM}`
      },
      body: JSON.stringify({ itens: carrinho })
    });
  } catch (error) {
    console.error('Erro salvar carrinho:', error);
  }
}

function adicionarCarrinho(produto) {
  const item = carrinho.find(i => i.id === produto.id);
  if (item) {
    item.quantidade++;
  } else {
    carrinho.push({ ...produto, quantidade: 1 });
  }
  
  localStorage.setItem('carrinhoJM', JSON.stringify(carrinho));
  salvarCarrinhoServidor();
  atualizarContador();
  mostrarToast(`${produto.nome} adicionado ao carrinho!`);
}

function atualizarContador() {
  const total = carrinho.reduce((s, i) => s + (i.quantidade || 0), 0);
  document.getElementById('carrinho-count').textContent = total;
}




// ===== RASTREIO DE ABANDONO =====
async function registrarCheckout() {
  try {
    const dadosUsuario = usuarioLogado ? {
      nome: usuarioLogado.nome,
      email: usuarioLogado.email,
      telefone: usuarioLogado.telefone || 'Não informado',
      regiao: usuarioLogado.regiao || 'Não informado'
    } : {
      nome: 'Visitante',
      email: 'Não informado',
      telefone: 'Não informado',
      regiao: 'Não informado'
    };
    
    await fetch(`${API_URL}/api/checkout/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        usuario: dadosUsuario,
        itens: carrinho
      })
    });
  } catch (error) {
    console.error('Erro registrar checkout:', error);
  }
}

async function atualizarStepCheckout(step, dados = null) {
  try {
    await fetch(`${API_URL}/api/checkout/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, step, dados })
    });
  } catch (error) {
    console.error('Erro atualizar step:', error);
  }
}

function renderizarCarrinho() {
  const container = document.getElementById('carrinhoItens');
  const totalSpan = document.getElementById('totalCarrinho');
  
  if (carrinho.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:30px;">🛒 Carrinho vazio</p>';
    totalSpan.textContent = '0';
    return;
  }
  
  container.innerHTML = carrinho.map(item => `
    <div class="item-carrinho">
      <img src="${item.imagem}" alt="${item.nome}">
      <div class="item-info">
        <p><b>${item.nome}</b></p>
        <p style="font-size:14px; color:#666;">
          ${item.preco.toLocaleString('pt-PT')} KZ x ${item.quantidade}
        </p>
      </div>
      <div style="display:flex; gap:5px; align-items:center;">
        <button onclick="alterarQuantidade(${item.id}, -1)" style="background:#E5E7EB; border:none; width:25px; height:25px; border-radius:50%; cursor:pointer;">-</button>
        <span style="min-width:20px; text-align:center;">${item.quantidade}</span>
        <button onclick="alterarQuantidade(${item.id}, 1)" style="background:#E5E7EB; border:none; width:25px; height:25px; border-radius:50%; cursor:pointer;">+</button>
        <button onclick="removerDoCarrinho(${item.id})" style="background:#DC2626; color:white; border:none; width:25px; height:25px; border-radius:50%; cursor:pointer; margin-left:5px;">✕</button>
      </div>
    </div>
  `).join('');
  
  const total = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
  totalSpan.textContent = total.toLocaleString('pt-PT');
}

function alterarQuantidade(id, delta) {
  const item = carrinho.find(i => i.id === id);
  if (!item) return;
  
  item.quantidade += delta;
  if (item.quantidade <= 0) {
    carrinho = carrinho.filter(i => i.id !== id);
  }
  
  localStorage.setItem('carrinhoJM', JSON.stringify(carrinho));
  salvarCarrinhoServidor();
  renderizarCarrinho();
  atualizarContador();
}

function removerDoCarrinho(id) {
  carrinho = carrinho.filter(i => i.id !== id);
  localStorage.setItem('carrinhoJM', JSON.stringify(carrinho));
  salvarCarrinhoServidor();
  renderizarCarrinho();
  atualizarContador();
}

// ===== FINALIZAR PEDIDO =====
async function finalizar() {
  if (!usuarioLogado) {
    mostrarToast('Faça login para finalizar', 'error');
    return abrirLogin();
  }
  
  if (carrinho.length === 0) {
    mostrarToast('Carrinho vazio', 'error');
    return;
  }
  
  const endereco = document.getElementById('endereco-entrega').value;
  const metodo = document.getElementById('metodo-pagamento').value;
  
  await atualizarStepCheckout('finalizando', { endereco, metodo });
  
  const btn = document.querySelector('#modal-carrinho .btn-whatsapp');
  const textoOriginal = btn.textContent;
  btn.textContent = '⏳ Processando...';
  btn.disabled = true;
  
  try {
    const res = await fetch(`${API_URL}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenJM}`
      },
      body: JSON.stringify({
        itens: carrinho,
        endereco,
        metodo_pagamento: metodo,
        sessionId
      })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      await atualizarStepCheckout('finalizado');
      
      carrinho = [];
      localStorage.removeItem('carrinhoJM');
      atualizarContador();
      fecharCarrinho();
      
      mostrarToast('✅ Pedido enviado! Redirecionando para WhatsApp...');
      setTimeout(() => {
        window.location.href = data.link;
      }, 2000);
    } else {
      mostrarToast(data.error || 'Erro ao finalizar', 'error');
    }
  } catch (error) {
    mostrarToast('Erro de conexão', 'error');
  } finally {
    btn.textContent = textoOriginal;
    btn.disabled = false;
  }
}

// ===== MODAIS =====
function abrirLogin() {
  document.getElementById('modal-login').style.display = 'block';
}

function fecharLogin() {
  document.getElementById('modal-login').style.display = 'none';
}

function abrirCadastro() {
  document.getElementById('modal-cadastro').style.display = 'block';
}

function fecharCadastro() {
  document.getElementById('modal-cadastro').style.display = 'none';
}

// ===== TOAST =====
function mostrarToast(mensagem, tipo = 'success') {
  const container = document.getElementById('toast-container') || criarToastContainer();
  const cores = {
    success: '#16A34A',
    error: '#DC2626',
    warning: '#F59E0B'
  };
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${cores[tipo] || cores.success};
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
    font-weight: bold;
    max-width: 350px;
  `;
  toast.textContent = mensagem;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function criarToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
  `;
  document.body.appendChild(container);
  return container;
}

// ===== FECHAR MODAIS CLICANDO FORA =====
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});
