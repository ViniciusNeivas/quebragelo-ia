# 🎲 QuebraGelo IA

Gerador de dinâmicas criativas para células cristãs usando Inteligência Artificial.

Projeto desenvolvido para a disciplina de **Inteligência Artificial para Devs** — Extensão Universitária.

---

## Tecnologias

- HTML, CSS e JavaScript (frontend)
- Groq API com LLaMA 3.3 70B (IA)
- Vercel (hospedagem e backend serverless)

---

## Como rodar localmente

1. Clone o repositório
2. Renomeie `js/script.example.js` para `js/script.js`
3. Coloque sua chave Groq na linha `GROQ_API_KEY_LOCAL`:
```js
const GROQ_API_KEY_LOCAL = "sua_chave_aqui";
```
4. Abra o `index.html` com o **Live Server** do VS Code

> A chave nunca vai para o GitHub — `js/script.js` está no `.gitignore`.

---

## Deploy (Vercel)

1. Importe o repositório em [vercel.com](https://vercel.com)
2. Adicione a variável de ambiente:
   - **Name:** `GROQ_API_KEY`
   - **Value:** sua chave `gsk_...`
3. Clique em **Deploy**

O projeto está publicado em: [link da Vercel após deploy]

---

## Avaliação

Testou a ferramenta? Deixe seu feedback:
[forms.gle/V2GYJUMFcB4Kxh857](https://forms.gle/V2GYJUMFcB4Kxh857)

---

## Padrão de Commits

Este projeto segue o padrão [Conventional Commits](https://www.conventionalcommits.org/).

### Estrutura

```
tipo(escopo): descrição curta em minúsculo
```

### Tipos utilizados

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `style` | Mudança visual ou de CSS sem alterar lógica |
| `refactor` | Reorganização de código sem mudar comportamento |
| `chore` | Configuração, arquivos de projeto |
| `docs` | Documentação |

### Exemplos

```
feat(dinamica): adicionar tipo emoji game
fix(popup): corrigir popup não aparecendo após segunda geração
style(formulario): agrupar campos em pares de duas colunas
refactor(prompt): separar prompts por tipo de dinâmica
chore(vercel): adicionar variável de ambiente GROQ_API_KEY
docs(readme): adicionar padrão de commits
feat(favicon): adicionar ícone SVG na aba do navegador
```
