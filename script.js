document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Lógica do Vídeo e Mudo ---
    const videoFundo = document.getElementById('video-fundo');
    const muteButton = document.getElementById('mute-button');

    if (videoFundo && muteButton) {
        muteButton.addEventListener('click', () => {
            videoFundo.muted = !videoFundo.muted;
            muteButton.textContent = videoFundo.muted ? '🔇 Mudo' : '🔊 Som';
        });
    }

    // --- 2. Menu Superior Sticky (Efeito de Vidro ao Rolar) ---
    const heroMenu = document.querySelector('.hero-menu');
    if (heroMenu) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                heroMenu.classList.add('hero-menu--sticky');
            } else {
                heroMenu.classList.remove('hero-menu--sticky');
            }
        });
    }

    // --- 3. Sistema de Comentários (Exclusivo da página Diretrizes) ---
    const formDiretriz = document.getElementById('form-diretriz');
    const listaComentarios = document.getElementById('lista-comentarios');

    // Só executa esta lógica se os elementos existirem na página atual
    if (formDiretriz && listaComentarios) {
        const CHAVE_STORAGE = 'ponto_eco_comentarios';
        const CHAVE_USUARIO = 'ponto_eco_token_voter';
        const BACKEND_URL = (location.protocol.startsWith('http') ? `${location.protocol}//${location.host}` : 'http://localhost:8000');

        let tokenUsuario = localStorage.getItem(CHAVE_USUARIO);
        if (!tokenUsuario) {
            tokenUsuario = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now();
            localStorage.setItem(CHAVE_USUARIO, tokenUsuario);
        }

        // aviso de compartilhamento removido conforme solicitado

        async function buscarComentarios() {
            try {
                const resp = await fetch(`${BACKEND_URL}/comments`);
                if (resp.ok) return await resp.json();
            } catch (e) {
                // fallback para localStorage
            }
            return JSON.parse(localStorage.getItem(CHAVE_STORAGE) || '[]').reverse();
        }

        async function atualizarInterface() {
            const comentarios = await buscarComentarios();
            listaComentarios.innerHTML = '';

            if (comentarios.length === 0) {
                const semComentarios = document.createElement('p');
                semComentarios.style.color = '#cbd5e1';
                semComentarios.style.marginTop = '10px';
                semComentarios.textContent = 'Nenhum comentário ainda. Seja o primeiro a deixar sua opinião!';
                listaComentarios.appendChild(semComentarios);
                return;
            }

            comentarios.forEach(com => {
                const div = document.createElement('div');
                div.style.cssText = 'background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 15px; margin-bottom: 15px; width: 100%; animation: fadeIn 0.4s ease;';
                const botaoApagar = (com.autorToken === tokenUsuario)
                    ? `<button onclick="deletarComentario('${com.id}')" class="btn-apagar" style="background: rgba(189, 29, 29, 0.15); border: 1px solid rgba(189, 29, 29, 0.4); color: #ff6b6b; padding: 6px 14px; border-radius: 50px; cursor: pointer; font-size: 0.8rem; font-family: 'Montserrat', sans-serif; font-weight: 600; transition: 0.3s;">Apagar meu comentário</button>`
                    : '';

                div.innerHTML = `
                    <strong style="color: #14b8a6; display: block; margin-bottom: 5px; font-size: 0.95rem;">${com.nome}</strong>
                    <p style="color: #e2e8f0; white-space: pre-wrap; margin-bottom: 12px; font-size: 0.9rem; line-height: 1.4;">${com.texto}</p>
                    ${botaoApagar}
                `;
                listaComentarios.appendChild(div);
            });
        }

        function subscribeToComentarios() {
            try {
                const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
                const host = location.host || 'localhost:8000';
                const wsUrl = `${protocol}://${host}/ws/comments`;
                const ws = new WebSocket(wsUrl);
                ws.addEventListener('message', () => {
                    atualizarInterface();
                });
                ws.addEventListener('open', () => console.info('Conectado ao servidor de comentários.'));
                ws.addEventListener('close', () => console.info('Conexão WebSocket fechada.'));
            } catch (err) {
                console.warn('WebSocket não disponível, atualizações em tempo real desativadas.', err);
            }
        }

        formDiretriz.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome-colaborador').value.trim();
            const texto = document.getElementById('texto-diretriz').value.trim();
            if (!nome || !texto) return;

            const novoCom = {
                id: 'id_' + Date.now(),
                nome,
                texto,
                autorToken: tokenUsuario
            };

            try {
                await fetch(`${BACKEND_URL}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoCom)
                });
            } catch (e) {
                const db = JSON.parse(localStorage.getItem(CHAVE_STORAGE) || '[]');
                db.push(novoCom);
                localStorage.setItem(CHAVE_STORAGE, JSON.stringify(db));
                atualizarInterface();
            }

            formDiretriz.reset();
        });

        window.deletarComentario = async (id) => {
            try {
                await fetch(`${BACKEND_URL}/comments/${id}?token=${encodeURIComponent(tokenUsuario)}`, { method: 'DELETE' });
            } catch (e) {
                let db = JSON.parse(localStorage.getItem(CHAVE_STORAGE) || '[]');
                const comParaDeletar = db.find(item => item.id === id);
                if (comParaDeletar && comParaDeletar.autorToken === tokenUsuario) {
                    db = db.filter(item => item.id !== id);
                    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(db));
                    atualizarInterface();
                } else if (comParaDeletar) {
                    alert('Ei! Você só pode apagar os seus próprios comentários. 😉');
                }
            }
        };

        atualizarInterface();
        subscribeToComentarios();
    }
});