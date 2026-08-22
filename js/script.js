// ============================================
// CONFIGURAÇÃO
// ============================================

const IS_LOCAL = location.hostname === '127.0.0.1' || location.hostname === 'localhost';

// Para rodar localmente: coloque sua chave Gemini aqui
// Obtenha em: aistudio.google.com/apikey
// ATENÇÃO: antes de fazer git push, apague a chave desta linha!
const GEMINI_API_KEY_LOCAL = "SUA_CHAVE_GEMINI_AQUI";

const btnGerar    = document.getElementById("gerar");
const resultado   = document.getElementById("resultado");
const loading     = document.getElementById("loading");
const placeholder = document.getElementById("placeholder");

const MSGS_LOADING = [
    "A IA está criando uma dinâmica incrível...",
    "Gerando perguntas de tirar o fôlego...",
    "Consultando o universo Marvel...",
    "Separando Pokémon dos remédios...",
    "Preparando a diversão da célula...",
    "Quase pronto, aguenta mais um segundo...",
];

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

let popupTimer = null;

function mostrarPopup() {
    document.getElementById("popupOverlay").classList.add("ativo");
}

function dispensarPopup() {
    document.getElementById("popupOverlay").classList.remove("ativo");
    cancelarPopup();
}

function fecharPopup(e) {
    if (e.target === document.getElementById("popupOverlay")) dispensarPopup();
}

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

// ============================================
// CAMPOS CONDICIONAIS
// ============================================

function atualizarCampos() {
    const tipo = document.getElementById("tipoDinamica").value;
    const blocoTema        = document.getElementById("blocoTema");
    const blocoDificuldade = document.getElementById("blocoDificuldade");
    const qtd              = document.getElementById("campoQuantidade");

    const semTema        = ["Pokémon ou Remédio", "Marvel ou DC", "Quebra-gelo"];
    const semDificuldade = ["Quebra-gelo", "Criar uma dinâmica inédita", "Pokémon ou Remédio", "Marvel ou DC"];
    const semQtd         = ["Quebra-gelo", "Criar uma dinâmica inédita"];

    blocoTema.style.display        = semTema.includes(tipo)        ? "none"  : "block";
    blocoDificuldade.style.display = semDificuldade.includes(tipo) ? "none"  : "block";
    qtd.style.display              = semQtd.includes(tipo)         ? "none"  : "flex";
}

document.querySelectorAll(".tema-tag").forEach(tag => {
    tag.addEventListener("click", () => {
        document.getElementById("tema").value = tag.textContent;
        document.getElementById("tema").focus();
    });
});

// ============================================
// COUNTDOWN VISÍVEL NO LOADING
// ============================================

async function contarRegressiva(segundos, tentativa, max) {
    for (let s = segundos; s > 0; s--) {
        document.getElementById("loadingMsg").textContent =
            `Aguardando ${s}s... (tentativa ${tentativa}/${max})`;
        await new Promise(r => setTimeout(r, 1000));
    }
    document.getElementById("loadingMsg").textContent =
        MSGS_LOADING[Math.floor(Math.random() * MSGS_LOADING.length)];
}

// ============================================
// GERAÇÃO COM RETRY AUTOMÁTICO
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

    cancelarPopup();
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

    const MAX_TENTATIVAS = 5;
    const maxTokensMap = {
        'Pokémon ou Remédio':        1000,
        'Marvel ou DC':              1000,
        'Quebra-gelo':               1000,
        'Jogo das 3 pistas':         1800,
        'Quiz':                      2000,
        'Verdadeiro ou Falso':       1200,
        'Quem Sou Eu?':              1800,
        'Complete a Frase':          1000,
        'Emoji Game':                 800,
        'Criar uma dinâmica inédita':1200,
    };
    const maxTokens = maxTokensMap[tipoDinamica] || 1200;

    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
        try {
            let texto;

            if (IS_LOCAL) {
                // ── LOCAL: chama Gemini direto ──
                const resposta = await fetch(
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": GEMINI_API_KEY_LOCAL
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: "Você é especialista em criar dinâmicas para células cristãs. Responda SEMPRE em português do Brasil. Siga EXATAMENTE as instruções abaixo sem introduções ou conclusões.\n\n" + prompt
                                }]
                            }],
                            generationConfig: {
                                maxOutputTokens: maxTokens,
                                temperature: 0.8
                            }
                        })
                    }
                );

                const dados = await resposta.json();

                if (resposta.status === 429 || resposta.status === 503) {
                    if (tentativa < MAX_TENTATIVAS) {
                        await contarRegressiva(15, tentativa, MAX_TENTATIVAS);
                        continue;
                    }
                    throw new Error("Limite de requisições atingido. Tente novamente em alguns segundos.");
                }

                if (!resposta.ok) throw new Error(`Erro ${resposta.status}: ${dados?.error?.message || "Tente novamente."}`);
                texto = dados.candidates?.[0]?.content?.parts?.[0]?.text || '';

            } else {
                // ── VERCEL: chama backend seguro ──
                const resposta = await fetch("/api/gerar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt, tipoDinamica })
                });

                const dados = await resposta.json();

                if (resposta.status === 429 || resposta.status === 503) {
                    if (tentativa < MAX_TENTATIVAS) {
                        const espera = dados?.retryAfter || 15;
                        await contarRegressiva(espera, tentativa, MAX_TENTATIVAS);
                        continue;
                    }
                    throw new Error("Limite de requisições atingido. Tente novamente em alguns segundos.");
                }

                if (!resposta.ok) throw new Error(`Erro ${resposta.status}: ${dados?.error || "Tente novamente."}`);
                texto = dados.resultado;
            }

            // Sucesso — processa resultado
            loading.style.display = "none";
            texto = (texto || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

            if (!texto || texto.length < 50) {
                if (tentativa < MAX_TENTATIVAS) {
                    document.getElementById("loadingMsg").textContent =
                        `Resposta incompleta. Tentando novamente (${tentativa}/${MAX_TENTATIVAS})...`;
                    await new Promise(r => setTimeout(r, 2000));
                    loading.style.display = "flex";
                    continue;
                }
                resultado.innerHTML = `<div class="dinamica"><div class="din-texto" style="color:#dc2626">Não foi possível gerar após ${MAX_TENTATIVAS} tentativas. Tente novamente.</div></div>`;
                break;
            }

            if (tipoDinamica === "Pokémon ou Remédio" || tipoDinamica === "Marvel ou DC") {
                texto = embaralharItens(texto);
            }

            salvarHistorico(tipoDinamica, tema, texto);
            agendarPopup(25000);
            resultado.innerHTML = renderizarDinamica(texto, tipoDinamica);
            break;

        } catch (erro) {
            loading.style.display = "none";
            resultado.innerHTML = `
                <div class="dinamica">
                    <div class="din-texto" style="color:#dc2626">❌ ${erro.message}</div>
                </div>`;
            console.error(erro);
            break;
        } finally {
            if (loading.style.display === "none") {
                btnGerar.disabled = false;
                btnGerar.textContent = "✨ Gerar Dinâmica";
            }
        }
    }

    // Garante que o botão seja reativado sempre
    btnGerar.disabled = false;
    btnGerar.textContent = "✨ Gerar Dinâmica";
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

function renderTresPistas(texto) {
    const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);
    let html = '';
    let cabecalho = {};
    let desafios = [];
    let desafioAtual = null;

    const camposCab = ["Nome da dinâmica","Objetivo","Tempo estimado","Participantes","Materiais","Como jogar","Regras","Dicas para o líder"];

    for (const linha of linhas) {
        const cabMatch = camposCab.find(c => linha.startsWith(c + ':') || linha.startsWith(c + ' :'));
        if (cabMatch) {
            cabecalho[cabMatch] = linha.replace(cabMatch, '').replace(/^[\s:]+/, '');
            continue;
        }
        if (/^Desafio\s+\d+$/i.test(linha)) {
            if (desafioAtual) desafios.push(desafioAtual);
            desafioAtual = { num: linha, pistas: [], resposta: '' };
            continue;
        }
        if (desafioAtual) {
            const pistasMatch = linha.match(/^(10|9|8)\s*pontos[:\s]+(.+)/i);
            if (pistasMatch) {
                desafioAtual.pistas.push({ pts: pistasMatch[1], texto: pistasMatch[2] });
            } else if (/^Resposta[:\s]+/i.test(linha)) {
                desafioAtual.resposta = linha.replace(/^Resposta[:\s]+/i, '');
            }
        }
    }
    if (desafioAtual) desafios.push(desafioAtual);

    html += `<div class="dinamica">`;
    html += `<div class="din-header">`;
    html += `<div class="din-nome">🎯 ${cabecalho["Nome da dinâmica"] || "Jogo das 3 Pistas"}</div>`;
    html += `<div class="din-meta">`;
    if (cabecalho["Tempo estimado"]) html += `<span class="din-badge">⏱ ${cabecalho["Tempo estimado"]}</span>`;
    if (cabecalho["Participantes"])  html += `<span class="din-badge">👥 ${cabecalho["Participantes"]}</span>`;
    if (cabecalho["Materiais"])      html += `<span class="din-badge">🎒 ${cabecalho["Materiais"]}</span>`;
    html += `</div></div>`;

    if (cabecalho["Como jogar"])        html += `<div class="din-secao"><div class="din-secao-titulo">Como jogar</div><div class="din-secao-corpo">${cabecalho["Como jogar"]}</div></div>`;
    if (cabecalho["Dicas para o líder"]) html += `<div class="din-secao"><div class="din-secao-titulo">💡 Dica para o líder</div><div class="din-secao-corpo">${cabecalho["Dicas para o líder"]}</div></div>`;

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

function renderItens(texto, tipo) {
    const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);
    let html = '<div class="dinamica">';
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

    html += `<div class="din-header">`;
    html += `<div class="din-nome">${tipo === 'pokemon' ? '🎮' : '🦸'} ${cabecalhoTemp["Nome da dinâmica"] || (tipo === 'pokemon' ? 'Pokémon ou Remédio?' : 'Marvel ou DC?')}</div>`;
    html += `<div class="din-meta">`;
    if (cabecalhoTemp["Tempo estimado"]) html += `<span class="din-badge">⏱ ${cabecalhoTemp["Tempo estimado"]}</span>`;
    if (cabecalhoTemp["Participantes"])  html += `<span class="din-badge">👥 ${cabecalhoTemp["Participantes"]}</span>`;
    html += `</div></div>`;

    if (cabecalhoTemp["Como jogar"]) html += `<div class="din-secao"><div class="din-secao-titulo">Como jogar</div><div class="din-secao-corpo">${cabecalhoTemp["Como jogar"]}</div></div>`;

    html += `<div class="din-secao-titulo" style="margin:12px 0 8px">Itens</div>`;
    html += itensHtml || `<div class="din-texto">${texto.replace(/\n/g,'<br>')}</div>`;
    html += acoes(texto);
    html += '</div>';
    return html;
}

function parseMarkdown(texto) {
    return texto
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function renderTextoFormatado(texto) {
    let html = '<div class="dinamica">';
    const camposCab = ["Nome da dinâmica","Objetivo","Tempo estimado","Participantes","Materiais","Como jogar","Regras","Dicas para o líder"];
    const cabecalho = {};
    const linhas = texto.split('\n');
    const corpoPuro = [];
    let cabacabou = false;

    for (const linha of linhas) {
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

    html += `<div class="din-header">`;
    html += `<div class="din-nome">🎲 ${nome}</div>`;
    html += `<div class="din-meta">`;
    if (cabecalho["Objetivo"])       html += `<span class="din-badge">🎯 ${cabecalho["Objetivo"]}</span>`;
    if (cabecalho["Tempo estimado"]) html += `<span class="din-badge">⏱ ${cabecalho["Tempo estimado"]}</span>`;
    if (cabecalho["Participantes"])  html += `<span class="din-badge">👥 ${cabecalho["Participantes"]}</span>`;
    if (cabecalho["Materiais"])      html += `<span class="din-badge">🎒 ${cabecalho["Materiais"]}</span>`;
    html += `</div></div>`;

    for (const s of [
        { campo: "Como jogar",         icone: "🕹️" },
        { campo: "Regras",             icone: "📋" },
        { campo: "Dicas para o líder", icone: "💡" },
    ]) {
        if (cabecalho[s.campo]) {
            html += `<div class="din-secao-card"><div class="din-secao-titulo">${s.icone} ${s.campo}</div><div class="din-secao-corpo">${parseMarkdown(cabecalho[s.campo])}</div></div>`;
        }
    }

    if (corpoPuro.length > 0) {
        html += `<div class="din-corpo-extra">${parseMarkdown(corpoPuro.join('\n'))}</div>`;
    }

    // Fallback: nenhum campo reconhecido — exibe texto puro
    if (Object.keys(cabecalho).length === 0 && corpoPuro.length === 0) {
        html = '<div class="dinamica">';
        html += `<div class="din-corpo-extra">${parseMarkdown(texto)}</div>`;
    }

    html += acoes(texto);
    html += '</div>';
    return html;
}

function acoes(texto) {
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
    const label     = document.getElementById("historicoLabel");

    if (historico.length <= 1) { container.innerHTML = ''; label.textContent = ''; return; }

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

function montarPrompt(participantes, idade, tempo, objetivo, tipo, tipoDinamica, tema, subtema, nivelGrupo, material, dificuldade, quantidade) {
    if (tipoDinamica === "Jogo das 3 pistas")   return promptTresPistas(participantes, idade, tempo, objetivo, tipo, tema, subtema, nivelGrupo, material, dificuldade, quantidade);
    if (tipoDinamica === "Pokémon ou Remédio")  return promptPokemonRemdio(participantes, idade, tempo, objetivo, material, dificuldade, quantidade);
    if (tipoDinamica === "Marvel ou DC")        return promptMarvelDC(participantes, idade, tempo, objetivo, material, dificuldade, quantidade);
    if (tipoDinamica === "Quiz")                return promptQuiz(participantes, idade, tempo, objetivo, tipo, tema, subtema, nivelGrupo, material, dificuldade, quantidade);
    return promptGenerico(participantes, idade, tempo, objetivo, tipo, tipoDinamica, tema, subtema, material, dificuldade, quantidade);
}

// ============================================
// JOGO DAS 3 PISTAS
// ============================================

function promptTresPistas(participantes, idade, tempo, objetivo, tipo, tema, subtema, nivelGrupo, material, dificuldade, quantidade) {
return `Crie exatamente ${quantidade} desafios do "Jogo das 3 Pistas".
Tema: ${tema || "Livre"}${subtema ? ` | Subtema: ${subtema}` : ""}
Nível do grupo: ${nivelGrupo} | Dificuldade: ${dificuldade}

REGRA 1 — Cada pista: NO MÁXIMO 2 PALAVRAS.
REGRA 2 — NUNCA use palavra do nome da resposta nas pistas (nome, apelido, tradução, sigla).
REGRA 3 — Pistas genéricas são inválidas (Herói, Vilão, Mutante, Vingador).
REGRA 4 — Cada resposta aparece UMA única vez.
REGRA 5 — Use APENAS o universo: ${tema || "Livre"}. Não misture universos.
REGRA 6 — Dicas e respostas em português. Inglês só quando não há tradução (ex: Batman).

EXEMPLOS CORRETOS:
Resposta: Thor → 10pts: Ragnarok | 9pts: Odinson | 8pts: Stormbreaker
Resposta: Doutor Estranho → 10pts: Sanctum | 9pts: Gema Tempo | 8pts: Neurocirurgião
Resposta: Nick Fury → 10pts: Triskelion | 9pts: Tapa-olho | 8pts: Helicarrier

DIFICULDADE ${dificuldade}: ${dificuldade === "Fácil" ? "personagens famosos, pistas acessíveis." : dificuldade === "Média" ? "misture famosos e intermediários, evite Homem de Ferro e Capitão América." : "apenas personagens de HQ, sem protagonistas dos filmes."}

FORMATO:
Nome da dinâmica: Jogo das 3 Pistas — ${tema || "Livre"}
Objetivo: ${objetivo}
Tempo estimado: ${tempo}
Participantes: ${participantes} | ${idade}
Materiais: ${material}
Como jogar: Leia as pistas uma a uma. 1ª pista = 10pts, 2ª = 9pts, 3ª = 8pts.
Regras: Resposta individual. Não fale antes do líder pedir.
Dicas para o líder: Faça pausas. Mantenha o suspense.

---

Desafio 1
10 pontos: [1-2 palavras em português]
9 pontos: [1-2 palavras em português]
8 pontos: [1-2 palavras em português]
Resposta: [resposta em português]

[repita até desafio ${quantidade}]

Responda APENAS com a dinâmica. Sem comentários.`;
}

// ============================================
// POKÉMON OU REMÉDIO
// ============================================

function promptPokemonRemdio(participantes, idade, tempo, objetivo, material, dificuldade, quantidade) {
return `Crie exatamente ${quantidade} itens para "Pokémon ou Remédio?". Nível: Difícil.

REGRAS:
- Use APENAS nomes reais — nunca invente.
- Pokémon das gerações 6-9 com nomes que parecem remédios: Comfey, Xurkitree, Bellibolt, Grafaiai, Fidough, Glimmora, Annihilape, Clodsire, Cetitan, Koraidon, Miraidon, Gimmighoul, Dachsbun, Arboliva, Farigiraf.
- Remédios com nomes que parecem Pokémon: Clobazam, Sirolimo, Ziprasidona, Eslicarbazepina, Teriflunomida, Ibrutinibe, Venetoclax, Natalizumabe, Tacrolimo, Fingolimode.
- PROIBIDO: Pokémon gens 1-2, remédios populares (Paracetamol, Ibuprofeno, Dipirona).
- Ordem ALEATÓRIA — nunca alternado P,R,P,R. Pode ter 2-4 do mesmo tipo seguidos.

FORMATO (sem texto extra, sem comentários):
Nome da dinâmica: Pokémon ou Remédio?
Objetivo: ${objetivo}
Tempo estimado: ${tempo}
Participantes: ${participantes}
Materiais: ${material}
Como jogar: O líder lê cada nome. Os participantes decidem: Pokémon ou Remédio?
Regras: Sem celular. Quem acertar mais vence.
Dicas para o líder: Leia devagar e dramaticamente.

---

1. Nome: [nome]
Resposta: [Pokémon ou Remédio]

[repita até o item ${quantidade}]`;
}

// ============================================
// MARVEL OU DC
// ============================================

function promptMarvelDC(participantes, idade, tempo, objetivo, material, dificuldade, quantidade) {
return `Crie exatamente ${quantidade} itens para "Marvel ou DC?". Nível: Difícil.

REGRAS:
- Misture heróis, vilões, equipes, objetos, locais, organizações.
- Apenas itens REAIS — nunca invente.
- Use PORTUGUÊS quando houver tradução oficial (Homem-Aranha, Coringa, Sindicato do Crime, Corte das Corujas). Inglês só quando não há tradução (Batman, Superman).
- Nível difícil: itens conhecidos apenas por leitores de HQ. Evite protagonistas dos filmes.

FORMATO (sem texto extra, sem comentários):
Nome da dinâmica: Marvel ou DC?
Objetivo: ${objetivo}
Tempo estimado: ${tempo}
Participantes: ${participantes}
Materiais: ${material}
Como jogar: O líder lê cada nome. Os participantes respondem: Marvel ou DC?
Regras: Sem celular. Quem acertar mais vence.
Dicas para o líder: Inclua itens que confundem para aumentar a diversão.

---

1. Nome: [nome em português quando possível]
Resposta: [Marvel ou DC]

[repita até o item ${quantidade}]`;
}

// ============================================
// QUIZ
// ============================================

function promptQuiz(participantes, idade, tempo, objetivo, tipo, tema, subtema, nivelGrupo, material, dificuldade, quantidade) {
return `Crie exatamente ${quantidade} perguntas de Quiz.
Tema: ${tema || "Livre"}${subtema ? ` | Subtema: ${subtema}` : ""}
Dificuldade: ${dificuldade}

Cada pergunta: enunciado + 4 alternativas (A/B/C/D) + resposta correta + explicação curta.
Dificuldade ${dificuldade}: ${dificuldade === "Fácil" ? "perguntas populares e diretas." : dificuldade === "Média" ? "misture fáceis e intermediárias." : "curiosidades para fãs dedicados."}

FORMATO:
Nome da dinâmica: Quiz — ${tema || "Livre"}
Objetivo: ${objetivo}
Tempo estimado: ${tempo}
Participantes: ${participantes} | ${idade}
Materiais: ${material}
Como jogar: O líder lê cada pergunta e alternativas. Participantes respondem.
Regras: Sem celular. Quem acertar mais vence.
Dicas para o líder: 15 segundos por pergunta. Revele a resposta com drama.

---

Pergunta 1
[enunciado]
A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]
Resposta: [letra]
Por quê: [explicação curta]

[repita até pergunta ${quantidade}]

Responda APENAS com o quiz. Sem comentários.`;
}

// ============================================
// GENÉRICO
// ============================================

function promptGenerico(participantes, idade, tempo, objetivo, tipo, tipoDinamica, tema, subtema, material, dificuldade, quantidade) {
return `Crie uma dinâmica do tipo "${tipoDinamica}" pronta para uso.
Tema: ${tema || "Livre"}${subtema ? ` | ${subtema}` : ""}
Participantes: ${participantes} — ${idade} | Tempo: ${tempo}
Objetivo: ${objetivo} | Materiais: ${material}
Dificuldade: ${dificuldade} | Quantidade: ${quantidade}

Inclua: Nome da dinâmica, Objetivo, Tempo estimado, Participantes, Materiais, Como jogar, Regras, Dicas para o líder.

${tipoDinamica === "Verdadeiro ou Falso" ? `Crie ${quantidade} afirmações (metade verdadeiras, metade falsas) com resposta e explicação.
Formato: [número]. [afirmação] → [Verdadeiro/Falso] — [explicação]` : ""}

${tipoDinamica === "Quem Sou Eu?" ? `Crie ${quantidade} personagens com 4 dicas progressivas SEM citar o nome. Não repita personagens. Dicas 100% corretas.
Formato:
Personagem [número]
Dica 1: [difícil] | Dica 2: [média] | Dica 3: [fácil] | Dica 4: [quase entrega]
Resposta: [nome]` : ""}

${tipoDinamica === "Complete a Frase" ? `Crie ${quantidade} frases com lacuna. Use filmes, séries, músicas gospel ou versículos.
Formato: [número]. "[frase com ___]" → Resposta: [palavra]` : ""}

${tipoDinamica === "Emoji Game" ? `Crie ${quantidade} desafios com emojis representando personagem, filme, música ou versículo.
Formato: [número]. [emojis] → Resposta: [resposta]` : ""}

${tipoDinamica === "Quebra-gelo" ? `Dinâmica criativa e fácil de executar para ${participantes} pessoas de ${idade} em ${tempo}.` : ""}

${tipoDinamica === "Criar uma dinâmica inédita" ? `Invente algo TOTALMENTE NOVO. Não use quiz, verdadeiro/falso ou jogo das pistas. Tema: ${tema || "Livre"}.` : ""}

Responda APENAS com a dinâmica. Sem comentários.`;
}

// ============================================
// EMBARALHAR ITENS
// ============================================

function embaralharItens(texto) {
    const linhas = texto.split('\n');
    const cabecalhoLinhas = [];
    const pares = [];
    let cabecalhoPronto = false;

    for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i].trim();
        const nomeMatch = linha.match(/^\d+\.\s*Nome:\s*(.+)/i);
        if (nomeMatch) {
            cabecalhoPronto = true;
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

    for (let i = pares.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pares[i], pares[j]] = [pares[j], pares[i]];
    }

    const itensTexto = pares.map((p, i) => `${i + 1}. Nome: ${p.nome}\nResposta: ${p.resposta}`);
    return cabecalhoLinhas.join('\n').trim() + '\n\n---\n\n' + itensTexto.join('\n\n');
}

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

function copiarTexto(btn, texto) {
    navigator.clipboard.writeText(texto).then(() => {
        btn.textContent = "✅ Copiado!";
        setTimeout(() => btn.textContent = "📋 Copiar", 2000);
        agendarPopup(3000);
    });
}