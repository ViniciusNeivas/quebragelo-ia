// ============================================
// CONFIGURAÇÃO
// ============================================

// Detecta se está rodando local (Live Server) ou na Vercel
const IS_LOCAL = location.hostname === '127.0.0.1' || location.hostname === 'localhost';

// Para rodar localmente: coloque sua chave Groq aqui
// Obtenha em: console.groq.com → API Keys
// ATENÇÃO: antes de fazer git push, apague a chave desta linha!
const GROQ_API_KEY_LOCAL = "SUA_CHAVE_GROQ_AQUI";


const btnGerar  = document.getElementById("gerar");
const resultado = document.getElementById("resultado");
const loading   = document.getElementById("loading");
const placeholder = document.getElementById("placeholder");

const MSGS_LOADING = [
    "A IA está criando uma dinâmica incrível...",
    "Gerando perguntas de tirar o fôlego...",
    "Consultando o universo Marvel...",
    "Separando Pokémon dos remédios...",
    "Preparando a diversão da célula...",
    "Quase pronto, aguenta mais um segundo...",
];

// Histórico em memória (máx 3)
const historico = [];

btnGerar.addEventListener("click", gerarDinamica);

// ============================================
// BOTÕES +/- CAMPOS NUMÉRICOS
// ============================================

function alterarNumero(id, delta) {
    const input = document.getElementById(id);
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 999;
    const atual = Number(input.value) || 0;
    input.value = Math.min(max, Math.max(min, atual + delta));
}

// ============================================
// POPUP DE AVALIAÇÃO
// ============================================

// ============================================
// POPUP DE AVALIAÇÃO
// ============================================

let popupTimer = null;

function mostrarPopup() {
    document.getElementById("popupOverlay").classList.add("ativo");
}

function dispensarPopup() {
    document.getElementById("popupOverlay").classList.remove("ativo");
    cancelarPopup(); // cancela qualquer timer pendente
}

function fecharPopup(e) {
    if (e.target === document.getElementById("popupOverlay")) dispensarPopup();
}

// Agenda popup — cancela timer anterior se houver
function agendarPopup(delayMs) {
    cancelarPopup();
    popupTimer = setTimeout(mostrarPopup, delayMs);
}

function cancelarPopup() {
    if (popupTimer) { clearTimeout(popupTimer); popupTimer = null; }
}

document.addEventListener("keydown", e => {
    if (e.key === "Escape") dispensarPopup();
});



function atualizarCampos() {
    const tipo = document.getElementById("tipoDinamica").value;
    const blocoTema       = document.getElementById("blocoTema");
    const blocoDificuldade = document.getElementById("blocoDificuldade");
    const qtd             = document.getElementById("campoQuantidade");

    // Tema e subtema: só para tipos que usam tema
    const semTema = ["Pokémon ou Remédio", "Marvel ou DC", "Quebra-gelo"];
    blocoTema.style.display = semTema.includes(tipo) ? "none" : "block";

    // Dificuldade: some para Quebra-gelo, Criar dinâmica inédita, Pokémon ou Remédio e Marvel ou DC
    const semDificuldade = ["Quebra-gelo", "Criar uma dinâmica inédita", "Pokémon ou Remédio", "Marvel ou DC"];
    blocoDificuldade.style.display = semDificuldade.includes(tipo) ? "none" : "block";

    // Quantidade: some para Quebra-gelo e Criar dinâmica inédita
    const semQtd = ["Quebra-gelo", "Criar uma dinâmica inédita"];
    qtd.style.display = semQtd.includes(tipo) ? "none" : "flex";
}

// Clique nas tags de tema
document.querySelectorAll(".tema-tag").forEach(tag => {
    tag.addEventListener("click", () => {
        document.getElementById("tema").value = tag.textContent;
        document.getElementById("tema").focus();
    });
});

// ============================================
// GERAÇÃO
// ============================================

async function gerarDinamica() {
    const participantes = document.getElementById("participantes").value;
    const idade         = document.getElementById("idade").value;
    const tempo         = document.getElementById("tempo").value;
    const objetivo      = document.getElementById("objetivo").value;
    const tipo          = document.getElementById("tipo").value;
    const tipoDinamica  = document.getElementById("tipoDinamica").value;
    const tema          = document.getElementById("tema")?.value.trim() || "";
    const subtema       = document.getElementById("subtema")?.value.trim() || "";
    const nivelGrupo    = document.getElementById("nivelGrupo")?.value || "Intermediário";
    const material      = document.getElementById("material").value;
    const dificuldade   = document.getElementById("dificuldade")?.value || "Média";
    const quantidade    = document.getElementById("quantidade")?.value || "10";

    // UI: inicia loading
    cancelarPopup(); // cancela popup pendente se pessoa clicou em gerar nova
    placeholder.style.display = "none";
    resultado.innerHTML = "";
    loading.style.display = "flex";
    btnGerar.disabled = true;
    btnGerar.textContent = "⏳ Gerando...";
    document.getElementById("loadingMsg").textContent =
        MSGS_LOADING[Math.floor(Math.random() * MSGS_LOADING.length)];

    const prompt = montarPrompt(
        participantes, idade, tempo, objetivo, tipo,
        tipoDinamica, tema, subtema, nivelGrupo,
        material, dificuldade, quantidade
    );

    try {
        let texto;

        if (IS_LOCAL) {
            // ── LOCAL (Live Server): chama Groq direto ──
            const resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY_LOCAL}`
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-120b",
                    max_tokens: 4096,
                    messages: [{
                        role: "user",
                        content: "Você é especialista em criar dinâmicas para células cristãs. Siga EXATAMENTE as instruções abaixo sem introduções ou conclusões.\n\n" + prompt
                    }]
                })
            });

            if (!resposta.ok) {
                const errJson = await resposta.json().catch(() => ({}));
                throw new Error(`Erro ${resposta.status}: ${errJson?.error?.message || "Tente novamente."}`);
            }

            const dados = await resposta.json();
            texto = dados.choices[0].message.content;

        } else {
            // ── VERCEL (produção): chama backend seguro ──
            const resposta = await fetch("/api/gerar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            if (!resposta.ok) {
                const errJson = await resposta.json().catch(() => ({}));
                throw new Error(`Erro ${resposta.status}: ${errJson?.error || "Tente novamente."}`);
            }

            const dados = await resposta.json();
            texto = dados.resultado;
        }

        loading.style.display = "none";
        texto = texto.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        // Embaralha se necessário
        if (tipoDinamica === "Pokémon ou Remédio" || tipoDinamica === "Marvel ou DC") {
            texto = embaralharItens(texto);
        }

        // Salva no histórico
        salvarHistorico(tipoDinamica, tema, texto);

        // Agenda popup 25s após geração — orgânico, pessoa já leu o resultado
        agendarPopup(25000);

        // Renderiza formatado
        resultado.innerHTML = renderizarDinamica(texto, tipoDinamica);

    } catch (erro) {
        loading.style.display = "none";
        resultado.innerHTML = `
            <div class="dinamica">
                <div class="din-texto" style="color:#dc2626">
                    ❌ ${erro.message}
                </div>
            </div>`;
        console.error(erro);
    } finally {
        btnGerar.disabled = false;
        btnGerar.textContent = "✨ Gerar Dinâmica";
    }
}

// ============================================
// RENDERIZAÇÃO FORMATADA
// ============================================

function renderizarDinamica(texto, tipo) {
    if (tipo === "Jogo das 3 pistas") return renderTresPistas(texto);
    if (tipo === "Pokémon ou Remédio") return renderItens(texto, "pokemon");
    if (tipo === "Marvel ou DC")       return renderItens(texto, "marveldc");
    return renderTextoFormatado(texto);
}

// Jogo das 3 pistas
function renderTresPistas(texto) {
    const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);
    let html = '';
    let cabecalho = {};
    let desafios = [];
    let desafioAtual = null;
    let fasePistas = false;

    const camposCab = ["Nome da dinâmica","Objetivo","Tempo estimado","Participantes","Materiais","Como jogar","Regras","Dicas para o líder"];

    for (const linha of linhas) {
        const cabMatch = camposCab.find(c => linha.startsWith(c + ':') || linha.startsWith(c + ' :'));
        if (cabMatch) {
            cabecalho[cabMatch] = linha.replace(cabMatch, '').replace(/^[\s:]+/, '');
            fasePistas = false;
            continue;
        }
        if (/^Desafio\s+\d+$/i.test(linha)) {
            if (desafioAtual) desafios.push(desafioAtual);
            desafioAtual = { num: linha, pistas: [], resposta: '' };
            fasePistas = true;
            continue;
        }
        if (desafioAtual) {
            const pistasMatch = linha.match(/^(10|9|8)\s*pontos[:\s]+(.+)/i);
            if (pistasMatch) {
                desafioAtual.pistas.push({ pts: pistasMatch[1], texto: pistasMatch[2] });
            } else if (/^Resposta[:\s]+/i.test(linha)) {
                desafioAtual.resposta = linha.replace(/^Resposta[:\s]+/i, '');
            } else if (/^---+$/.test(linha)) {
                // separador
            }
        }
    }
    if (desafioAtual) desafios.push(desafioAtual);

    // Cabeçalho
    html += `<div class="dinamica">`;
    html += `<div class="din-header">`;
    html += `<div class="din-nome">🎯 ${cabecalho["Nome da dinâmica"] || "Jogo das 3 Pistas"}</div>`;
    html += `<div class="din-meta">`;
    if (cabecalho["Tempo estimado"]) html += `<span class="din-badge">⏱ ${cabecalho["Tempo estimado"]}</span>`;
    if (cabecalho["Participantes"]) html += `<span class="din-badge">👥 ${cabecalho["Participantes"]}</span>`;
    if (cabecalho["Materiais"]) html += `<span class="din-badge">🎒 ${cabecalho["Materiais"]}</span>`;
    html += `</div></div>`;

    if (cabecalho["Como jogar"]) html += `<div class="din-secao"><div class="din-secao-titulo">Como jogar</div><div class="din-secao-corpo">${cabecalho["Como jogar"]}</div></div>`;
    if (cabecalho["Dicas para o líder"]) html += `<div class="din-secao"><div class="din-secao-titulo">💡 Dica para o líder</div><div class="din-secao-corpo">${cabecalho["Dicas para o líder"]}</div></div>`;

    // Desafios
    if (desafios.length > 0) {
        html += `<div class="din-secao-titulo" style="margin-bottom:10px">Desafios</div>`;
        for (const d of desafios) {
            html += `<div class="din-desafio">`;
            html += `<div class="din-desafio-titulo">${d.num}</div>`;
            for (const p of d.pistas) {
                const cls = p.pts === '9' ? 'pts-9' : p.pts === '8' ? 'pts-8' : '';
                html += `<div class="din-pista"><span class="din-pista-pts ${cls}">${p.pts} pts</span><span>${p.texto}</span></div>`;
            }
            if (d.resposta) html += `<div class="din-resposta">Resposta: <strong>${d.resposta}</strong></div>`;
            html += `</div>`;
        }
    } else {
        html += `<div class="din-texto">${texto.replace(/\n/g, '<br>')}</div>`;
    }

    html += acoes(texto);
    html += `</div>`;
    return html;
}

// Pokémon ou Remédio / Marvel ou DC
function renderItens(texto, tipo) {
    const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);
    let html = '<div class="dinamica">';
    let cabecalhoHtml = '';
    let itensHtml = '';
    let cabecalhoPronto = false;
    let cabecalhoTemp = {};
    const camposCab = ["Nome da dinâmica","Objetivo","Tempo estimado","Participantes","Materiais","Como jogar","Regras","Dicas para o líder"];

    for (const linha of linhas) {
        const itemMatch = linha.match(/^\d+\.\s+Nome:\s*(.+)/i);
        const respMatch = linha.match(/^Resposta:\s*(.+)/i);

        if (itemMatch) {
            cabecalhoPronto = true;
            itensHtml += `<div class="din-item"><span class="din-item-nome">${itemMatch[1]}</span>`;
        } else if (respMatch && cabecalhoPronto && itensHtml.endsWith('</span>')) {
            const resp = respMatch[1].trim();
            let cls = 'resp-outro';
            if (/pok[eé]mon/i.test(resp)) cls = 'resp-pokemon';
            else if (/rem[eé]dio/i.test(resp)) cls = 'resp-remedio';
            else if (/marvel/i.test(resp)) cls = 'resp-marvel';
            else if (/dc/i.test(resp)) cls = 'resp-dc';
            itensHtml += `<span class="din-item-resp ${cls}">${resp}</span></div>`;
        } else if (!cabecalhoPronto) {
            const cab = camposCab.find(c => linha.startsWith(c + ':'));
            if (cab) cabecalhoTemp[cab] = linha.replace(cab + ':', '').trim();
        }
    }

    // Cabeçalho
    html += `<div class="din-header">`;
    html += `<div class="din-nome">${tipo === 'pokemon' ? '🎮' : '🦸'} ${cabecalhoTemp["Nome da dinâmica"] || (tipo === 'pokemon' ? 'Pokémon ou Remédio?' : 'Marvel ou DC?')}</div>`;
    html += `<div class="din-meta">`;
    if (cabecalhoTemp["Tempo estimado"]) html += `<span class="din-badge">⏱ ${cabecalhoTemp["Tempo estimado"]}</span>`;
    if (cabecalhoTemp["Participantes"]) html += `<span class="din-badge">👥 ${cabecalhoTemp["Participantes"]}</span>`;
    html += `</div></div>`;

    if (cabecalhoTemp["Como jogar"]) html += `<div class="din-secao"><div class="din-secao-titulo">Como jogar</div><div class="din-secao-corpo">${cabecalhoTemp["Como jogar"]}</div></div>`;

    html += `<div class="din-secao-titulo" style="margin:12px 0 8px">Itens</div>`;
    html += itensHtml || `<div class="din-texto">${texto.replace(/\n/g,'<br>')}</div>`;
    html += acoes(texto);
    html += '</div>';
    return html;
}

// Converte markdown simples em HTML
function parseMarkdown(texto) {
    return texto
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

// Texto formatado genérico
function renderTextoFormatado(texto) {
    let html = '<div class="dinamica">';

    const camposCab = ["Nome da dinâmica","Objetivo","Tempo estimado","Participantes","Materiais","Como jogar","Regras","Dicas para o líder"];
    const cabecalho = {};
    const linhas = texto.split('\n');
    const corpoPuro = [];
    let cabacabou = false;

    for (const linha of linhas) {
        // Remove ** do início para detectar campo (ex: **Nome da dinâmica:** ...)
        const limpinha = linha.trim().replace(/^\*\*/,'').replace(/\*\*/,'');
        const cab = camposCab.find(c => limpinha.startsWith(c + ':') || limpinha.startsWith(c + ' :'));
        if (cab && !cabacabou) {
            cabecalho[cab] = limpinha.replace(cab, '').replace(/^[\s:]+/, '').trim();
        } else {
            cabacabou = true;
            if (linha.trim()) corpoPuro.push(linha);
        }
    }

    const nome = cabecalho["Nome da dinâmica"] || "Dinâmica";

    // Cabeçalho
    html += `<div class="din-header">`;
    html += `<div class="din-nome">🎲 ${nome}</div>`;
    html += `<div class="din-meta">`;
    if (cabecalho["Objetivo"])       html += `<span class="din-badge">🎯 ${cabecalho["Objetivo"]}</span>`;
    if (cabecalho["Tempo estimado"]) html += `<span class="din-badge">⏱ ${cabecalho["Tempo estimado"]}</span>`;
    if (cabecalho["Participantes"])  html += `<span class="din-badge">👥 ${cabecalho["Participantes"]}</span>`;
    if (cabecalho["Materiais"])      html += `<span class="din-badge">🎒 ${cabecalho["Materiais"]}</span>`;
    html += `</div></div>`;

    // Seções principais em cards
    const secoes = [
        { campo: "Como jogar",       icone: "🕹️" },
        { campo: "Regras",           icone: "📋" },
        { campo: "Dicas para o líder", icone: "💡" },
    ];

    for (const s of secoes) {
        if (cabecalho[s.campo]) {
            html += `
            <div class="din-secao-card">
                <div class="din-secao-titulo">${s.icone} ${s.campo}</div>
                <div class="din-secao-corpo">${parseMarkdown(cabecalho[s.campo])}</div>
            </div>`;
        }
    }

    // Corpo extra (conteúdo após os campos padrão)
    if (corpoPuro.length > 0) {
        const corpoHtml = parseMarkdown(corpoPuro.join('\n'));
        html += `<div class="din-corpo-extra">${corpoHtml}</div>`;
    }

    html += acoes(texto);
    html += '</div>';
    return html;
}

function acoes(texto) {
    // Usa data-attribute para evitar quebra com caracteres especiais
    const id = 'txt-' + Math.random().toString(36).slice(2, 8);
    return `
        <textarea id="${id}" style="display:none">${texto.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
        <div class="din-acoes">
            <button class="btn-copiar" onclick="copiarPorId('${id}', this)">📋 Copiar</button>
            <button class="btn-nova" onclick="document.getElementById('gerar').click()">🔄 Gerar nova</button>
        </div>`;
}

// ============================================
// HISTÓRICO
// ============================================

function salvarHistorico(tipo, tema, texto) {
    historico.unshift({ tipo, tema, texto, hora: new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}) });
    if (historico.length > 3) historico.pop();
    renderizarHistorico();
}

function renderizarHistorico() {
    const container = document.getElementById("historicoContainer");
    const label = document.getElementById("historicoLabel");

    if (historico.length <= 1) {
        container.innerHTML = '';
        label.textContent = '';
        return;
    }

    label.textContent = `${historico.length - 1} geração(ões) anterior(es)`;

    let html = `<div class="historico-titulo">Histórico</div>`;
    for (let i = 1; i < historico.length; i++) {
        const h = historico[i];
        html += `<div class="historico-item" onclick="verHistorico(${i})">
            <div>
                <div class="historico-info">${h.tipo}${h.tema ? ' — ' + h.tema : ''}</div>
                <div class="historico-sub">Gerado às ${h.hora}</div>
            </div>
            <span class="historico-seta">↩</span>
        </div>`;
    }
    container.innerHTML = html;
}

function verHistorico(idx) {
    const h = historico[idx];
    resultado.innerHTML = renderizarDinamica(h.texto, h.tipo);
    resultado.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// ROTEADOR DE PROMPTS
// ============================================

function montarPrompt(
    participantes, idade, tempo, objetivo, tipo,
    tipoDinamica, tema, subtema, nivelGrupo,
    material, dificuldade, quantidade
) {
    if (tipoDinamica === "Jogo das 3 pistas") {
        return promptTresPistas(participantes, idade, tempo, objetivo, tipo, tema, subtema, nivelGrupo, material, dificuldade, quantidade);
    }
    if (tipoDinamica === "Pokémon ou Remédio") {
        return promptPokemonRemdio(participantes, idade, tempo, objetivo, material, dificuldade, quantidade);
    }
    if (tipoDinamica === "Marvel ou DC") {
        return promptMarvelDC(participantes, idade, tempo, objetivo, material, dificuldade, quantidade);
    }
    if (tipoDinamica === "Quiz") {
        return promptQuiz(participantes, idade, tempo, objetivo, tipo, tema, subtema, nivelGrupo, material, dificuldade, quantidade);
    }
    return promptGenerico(participantes, idade, tempo, objetivo, tipo, tipoDinamica, tema, subtema, material, dificuldade, quantidade);
}

// ============================================
// JOGO DAS 3 PISTAS
// ============================================

function promptTresPistas(participantes, idade, tempo, objetivo, tipo, tema, subtema, nivelGrupo, material, dificuldade, quantidade) {
return `Crie exatamente ${quantidade} desafios do "Jogo das 3 Pistas".
Tema: ${tema || "Livre"}${subtema ? ` | Subtema: ${subtema}` : ""}
Nível do grupo: ${nivelGrupo} | Dificuldade: ${dificuldade}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA 1 — TAMANHO DAS PISTAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cada pista deve ter NO MÁXIMO 2 PALAVRAS.
Exemplos corretos: "Vibranium", "Wakanda", "Pym Partículas", "Quantum Realm"
Exemplos ERRADOS: "Nação africana", "Tecnologia avançada", "Soldado super soldado"
Se a pista tiver 3 ou mais palavras, reescreva.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA 2 — PROIBIÇÃO TOTAL DE NOMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NUNCA use nas pistas qualquer palavra do nome da resposta.
• Resposta "Homem de Ferro" → proibido: Tony, Stark, Iron, Man, Homem, Ferro, Armadura
• Resposta "Capitão América" → proibido: Steve, Rogers, Cap, Capitão, América, Escudo
• Resposta "Gavião Arqueiro" → proibido: Clint, Barton, Gavião, Arqueiro, Hawkeye, Arco, Flecha
• Resposta "Pantera Negra" → proibido: T'Challa, Pantera, Negra, Wakanda, Vibranium (quando entrega)
• Resposta "Professor X" → proibido: Charles, Xavier, Professor, X, Escola, Mutantes
• Resposta "Thanos" → proibido: Thanos, Infinito, Joias, Manopla, Dedos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA 3 — SEM PISTAS GENÉRICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pistas que servem para 2 ou mais personagens são INVÁLIDAS.
❌ "Herói", "Vilão", "Poderoso", "Mutante", "Vingador", "Alienígena"
❌ "Planeta destruído" (serve para vários), "Escola especiais" (serve para vários)
Cada pista deve identificar UM único personagem/item no universo inteiro.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA 4 — SEM REPETIÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cada resposta deve aparecer UMA única vez nos ${quantidade} desafios.
Não repita o mesmo personagem em desafios diferentes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA 5 — TEMA EXCLUSIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use APENAS personagens, locais e objetos do universo: ${tema || "Livre"}.
Não misture universos diferentes (ex: não misture Marvel com DC).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXEMPLO DE DESAFIO CORRETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resposta: Thor

ERRADO ❌
10 pontos: Asgardiano (genérico — serve para Loki, Odin, Valquíria)
9 pontos: Mjolnir (entrega a resposta diretamente)
8 pontos: Thor (é a própria resposta!)

CORRETO ✅
10 pontos: Ragnarok (evento específico ligado a Thor)
9 pontos: Odinson (sobrenome, não parte do nome Thor)
8 pontos: Stormbreaker (arma exclusiva, não é o nome)

---

Resposta: Doutor Estranho

ERRADO ❌
10 pontos: Kamar-Taj (entrega pois só ele é mestre de Kamar-Taj)
9 pontos: Mago (genérico)
8 pontos: Estranho (parte do nome!)

CORRETO ✅
10 pontos: Sanctum (sede exclusiva dele)
9 pontos: Tempo Gema (pedra que ele guardava)
8 pontos: Neurocirurgião (profissão antes dos poderes)

---

Resposta: Nick Fury

ERRADO ❌
10 pontos: S.H.I.E.L.D (muito ligado ao nome)
9 pontos: Agente (genérico)
8 pontos: Fury (é o sobrenome da resposta!)

CORRETO ✅
10 pontos: Triskelion (sede da S.H.I.E.L.D.)
9 pontos: Tapa-olho (característica física única)
8 pontos: Helicarrier (veículo exclusivo da organização dele)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIFICULDADE: ${dificuldade}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${dificuldade === "Fácil"
    ? "Use personagens muito famosos. Pistas possíveis de acertar mesmo sem ser fã."
    : dificuldade === "Média"
    ? "Misture personagens famosos e intermediários. Pistas exigem algum conhecimento. EVITE protagonistas óbvios como Homem de Ferro e Capitão América."
    : "Use apenas personagens/locais conhecidos por fãs de HQ. PROIBIDO usar protagonistas dos filmes. Prefira coadjuvantes, locais e objetos de arcos menos conhecidos."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECKLIST ANTES DE CADA DESAFIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Alguma pista tem mais de 2 palavras? → Reescreva.
2. Alguma pista usa palavra do nome da resposta? → Reescreva.
3. Alguma pista é genérica (serve para 2+ personagens)? → Reescreva.
4. A pista de 8 pontos entrega a resposta? → Reescreva.
5. Esse personagem já apareceu em outro desafio? → Troque.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE SAÍDA — SIGA EXATAMENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome da dinâmica: Jogo das 3 Pistas — ${tema || "Livre"}
Objetivo: ${objetivo}
Tempo estimado: ${tempo}
Participantes: ${participantes} | ${idade}
Materiais: ${material}
Como jogar: Leia as pistas uma a uma. Quem acertar na 1ª pista ganha 10 pts, na 2ª ganha 9 pts, na 3ª ganha 8 pts.
Regras: Cada participante responde individualmente. Não fale a resposta antes do líder pedir.
Dicas para o líder: Faça pausas entre as pistas. Mantenha o suspense.

---

Desafio 1

10 pontos
[1-2 palavras]

9 pontos
[1-2 palavras]

8 pontos
[1-2 palavras]

Resposta
[resposta]

[repita até o desafio ${quantidade}]

Responda APENAS com a dinâmica. Sem introduções, explicações ou comentários.`;
}

// ============================================
// POKÉMON OU REMÉDIO
// ============================================

function promptPokemonRemdio(participantes, idade, tempo, objetivo, material, dificuldade, quantidade) {
// Sempre no nível máximo — é o que torna a dinâmica divertida
const nivel = "Difícil";
return `Crie exatamente ${quantidade} itens para o jogo "Pokémon ou Remédio".
Dificuldade: ${nivel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA DE ORDEM — MUITO IMPORTANTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NUNCA alterne a ordem de forma previsível (Pokémon, Remédio, Pokémon, Remédio...).
Embaralhe de forma ALEATÓRIA e IMPREVISÍVEL.
Exemplos de ordem boa: P, P, R, P, R, R, P, R, P, R
Ou: R, R, P, R, P, P, R, P, R, P
Pode ter 2, 3 ou até 4 do mesmo tipo seguidos.
O participante NUNCA deve conseguir adivinhar pelo padrão de alternância.
NUNCA invente nomes. Use apenas Pokémon que existem no jogo e remédios que existem de verdade.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS DE DIFICULDADE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NÍVEL DIFÍCIL/ESPECIALISTA:
Use APENAS Pokémon das gerações 6 a 9 com nomes que PARECEM remédios:
Exemplos: Comfey, Xurkitree, Silicobra, Arboliva, Bellibolt, Grafaiai, Fidough, Dachsbun, Cetitan, Wo-Chien, Chien-Pao, Ting-Lu, Chi-Yu, Koraidon, Miraidon, Glimmora, Gimmighoul, Annihilape, Clodsire, Farigiraf

Use APENAS remédios com nomes que PARECEM Pokémon:
Exemplos: Clobazam, Tacrolimo, Sirolimo, Ziprasidona, Vardenafila, Eslicarbazepina, Teriflunomida, Fingolimode, Natalizumabe, Ocrelizumabe, Alemtuzumabe, Ibrutinibe, Venetoclax, Carfilzomibe, Idelalisibe

O objetivo é ser IMPOSSÍVEL adivinhar apenas pelo som do nome.
PROIBIDO usar Pokémon das gerações 1 e 2.
PROIBIDO usar remédios conhecidos popularmente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE SAÍDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome da dinâmica: Pokémon ou Remédio?
Objetivo: ${objetivo}
Tempo estimado: ${tempo}
Participantes: ${participantes}
Materiais: ${material}
Como jogar: O líder lê cada nome. Os participantes decidem: Pokémon ou Remédio?
Regras: Sem consultar o celular. Quem acertar mais pontos vence.
Dicas para o líder: Leia devagar e dramaticamente para aumentar a tensão.

---

${Array.from({length: quantidade}, (_, i) => `${i + 1}. Nome: [nome]\nResposta: [Pokémon ou Remédio]`).join("\n\n")}

Responda APENAS com a dinâmica. Sem introduções ou comentários.`;
}

// ============================================
// MARVEL OU DC
// ============================================

function promptMarvelDC(participantes, idade, tempo, objetivo, material, dificuldade, quantidade) {
// Sempre no nível máximo para ser mais divertido
const nivel = "Difícil";
return `Crie exatamente ${quantidade} itens para o jogo "Marvel ou DC".
Dificuldade: ${nivel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Não use apenas heróis. Misture: heróis, vilões, equipes, objetos, locais, organizações.
Todos os itens devem ser REAIS do universo Marvel ou DC — nunca invente.
Use o NOME EM PORTUGUÊS quando existir tradução oficial (ex: Homem-Aranha, Coringa, Mulher-Maravilha, Sindicato do Crime e não Crime Syndicate, Corte das Coruja e não Court of Owls ou coisas similares).
Quando não houver tradução oficial consagrada, use o nome original em inglês (ex: Batman, Superman).

Dificuldade ${nivel}:
Use personagens, locais e objetos conhecidos apenas por leitores de HQ. Evite protagonistas dos filmes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE SAÍDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome da dinâmica: Marvel ou DC?
Objetivo: ${objetivo}
Tempo estimado: ${tempo}
Participantes: ${participantes}
Materiais: ${material}
Como jogar: O líder lê cada nome. Os participantes respondem: Marvel ou DC?
Regras: Sem celular. Quem acertar mais vence.
Dicas para o líder: Inclua itens que confundem para aumentar a diversão.

---

${Array.from({length: quantidade}, (_, i) => `${i + 1}. Nome: [nome]\nResposta: [Marvel ou DC]`).join("\n\n")}

Responda APENAS com a dinâmica. Sem introduções ou comentários.`;
}

// ============================================
// QUIZ
// ============================================

function promptQuiz(participantes, idade, tempo, objetivo, tipo, tema, subtema, nivelGrupo, material, dificuldade, quantidade) {
return `Crie exatamente ${quantidade} perguntas de Quiz.
Tema: ${tema || "Livre"}${subtema ? ` | Subtema: ${subtema}` : ""}
Nível do grupo: ${nivelGrupo} | Dificuldade: ${dificuldade}

Cada pergunta deve ter:
- Enunciado claro
- 4 alternativas (A, B, C, D)
- Resposta correta indicada
- Explicação curta do porquê

Dificuldade ${dificuldade}:
${dificuldade === "Fácil"
    ? "Perguntas diretas sobre referências muito populares."
    : dificuldade === "Média"
    ? "Misture perguntas fáceis e intermediárias. Algumas devem exigir conhecimento."
    : "Use curiosidades, detalhes e informações conhecidas apenas por fãs dedicados. Evite perguntas óbvias."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE SAÍDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome da dinâmica: Quiz — ${tema || "Livre"}
Objetivo: ${objetivo}
Tempo estimado: ${tempo}
Participantes: ${participantes} | ${idade}
Materiais: ${material}
Como jogar: O líder lê cada pergunta e as alternativas. Os participantes anotam ou respondem em voz alta.
Regras: Sem celular. Quem acertar mais pontos vence.
Dicas para o líder: Dê 15 segundos por pergunta. Revele a resposta com drama.

---

Pergunta 1
[enunciado]
A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]
Resposta: [letra]
Por quê: [explicação curta]

[repita até a pergunta ${quantidade}]

Responda APENAS com o quiz. Sem introduções ou comentários.`;
}

// ============================================
// GENÉRICO — demais tipos
// ============================================

function promptGenerico(participantes, idade, tempo, objetivo, tipo, tipoDinamica, tema, subtema, material, dificuldade, quantidade) {
return `Crie uma dinâmica do tipo "${tipoDinamica}" pronta para uso imediato.
Tema: ${tema || "Livre"}${subtema ? ` | Subtema: ${subtema}` : ""}
Participantes: ${participantes} — ${idade}
Tempo: ${tempo} | Objetivo: ${objetivo}
Tipo de reunião: ${tipo} | Materiais: ${material}
Dificuldade: ${dificuldade} | Quantidade: ${quantidade}

Inclua sempre no início:
Nome da dinâmica, Objetivo, Tempo estimado, Participantes, Materiais, Como jogar, Regras, Dicas para o líder.

${tipoDinamica === "Verdadeiro ou Falso" ? `
Crie exatamente ${quantidade} afirmações. Metade verdadeiras, metade falsas.
Inclua resposta e explicação curta para cada.
Dificuldade ${dificuldade}: ${dificuldade === "Fácil" ? "afirmações óbvias" : dificuldade === "Média" ? "misture fáceis e difíceis" : "afirmações que enganam até fãs dedicados"}.
Formato: [número]. [afirmação] → [Verdadeiro/Falso] — [explicação]
` : ""}

${tipoDinamica === "Quem Sou Eu?" ? `
Crie exatamente ${quantidade} personagens do tema: ${tema || "Livre"}.
Cada um com 4 dicas progressivas SEM citar o nome da resposta.
Responda TUDO em português brasileiro.

REGRAS OBRIGATÓRIAS:
- Cada personagem deve aparecer UMA única vez — NUNCA repita a mesma resposta
- As dicas devem ser 100% corretas e verificáveis — não invente fatos
- Dica 1: muito difícil, curiosidade rara
- Dica 2: média, ajuda a direcionar
- Dica 3: mais fácil, característica conhecida
- Dica 4: quase entrega, mas sem citar o nome

VERIFICAÇÃO antes de cada personagem:
1. Essa resposta já apareceu antes? → Se SIM, troque
2. As dicas são factualmente corretas? → Se NÃO, reescreva
3. Alguma dica cita o nome da resposta? → Se SIM, reescreva

Formato:
Personagem [número]
Dica 1: [muito difícil]
Dica 2: [média]
Dica 3: [mais fácil]
Dica 4: [quase entrega]
Resposta: [nome]
` : ""}

${tipoDinamica === "Complete a Frase" ? `
Crie exatamente ${quantidade} frases com lacuna para completar.
Use frases de filmes, séries, músicas gospel ou versículos bíblicos.
Formato: [número]. "[frase com ___]" → Resposta: [palavra]
` : ""}

${tipoDinamica === "Emoji Game" ? `
Crie exatamente ${quantidade} desafios com emojis representando personagem, filme, música ou versículo.
Formato: [número]. [emojis] → Resposta: [resposta]
` : ""}

${tipoDinamica === "Quebra-gelo" ? `
Crie uma dinâmica de quebra-gelo criativa, fácil de executar sem preparação, para ${participantes} pessoas de ${idade} em ${tempo}.
` : ""}

${tipoDinamica === "Criar uma dinâmica inédita" ? `
Invente uma dinâmica TOTALMENTE NOVA. Não use quiz, verdadeiro/falso ou jogo das pistas.
Tema: ${tema || "Livre"}. Seja criativo e surpreendente.
` : ""}

Responda APENAS com a dinâmica pronta. Sem introduções ou comentários.`;
}

// ============================================
// EMBARALHAR ITENS (Pokémon ou Remédio / Marvel ou DC)
// ============================================

function embaralharItens(texto) {
    const linhas = texto.split('\n');
    const cabecalhoLinhas = [];
    const pares = []; // cada par = { nome, resposta }
    let cabecalhoPronto = false;

    for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i].trim();
        const nomeMatch = linha.match(/^\d+\.\s*Nome:\s*(.+)/i);
        if (nomeMatch) {
            cabecalhoPronto = true;
            // próxima linha não-vazia deve ser a resposta
            let resp = '';
            for (let j = i + 1; j < linhas.length; j++) {
                const prox = linhas[j].trim();
                if (prox) {
                    const respMatch = prox.match(/^Resposta:\s*(.+)/i);
                    if (respMatch) resp = respMatch[1];
                    break;
                }
            }
            pares.push({ nome: nomeMatch[1], resposta: resp });
        } else if (!cabecalhoPronto && !/^---+$/.test(linha)) {
            cabecalhoLinhas.push(linhas[i]);
        }
    }

    if (pares.length === 0) return texto;

    // Fisher-Yates shuffle
    for (let i = pares.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pares[i], pares[j]] = [pares[j], pares[i]];
    }

    // Reconstrói o texto com itens embaralhados e renumerados
    const itensTexto = pares.map((p, i) =>
        `${i + 1}. Nome: ${p.nome}\nResposta: ${p.resposta}`
    );

    return cabecalhoLinhas.join('\n').trim() + '\n\n---\n\n' + itensTexto.join('\n\n');
}

// ============================================
// COPIAR
// ============================================
// COPIAR
// ============================================

function copiarPorId(id, btn) {
    const el = document.getElementById(id);
    if (!el) return;
    navigator.clipboard.writeText(el.value).then(() => {
        btn.textContent = "✅ Copiado!";
        setTimeout(() => btn.textContent = "📋 Copiar", 2000);
        agendarPopup(3000);
    });
}

// Mantido para compatibilidade
function copiarTexto(btn, texto) {
    navigator.clipboard.writeText(texto).then(() => {
        btn.textContent = "✅ Copiado!";
        setTimeout(() => btn.textContent = "📋 Copiar", 2000);
        agendarPopup(3000);
    });
}
