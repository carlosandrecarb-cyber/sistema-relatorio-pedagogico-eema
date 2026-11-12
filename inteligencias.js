// ==========================================
// MÓDULO 1: LEITURA DE EXCEL (DRAG & DROP)
// ==========================================
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) processarArquivoExcel(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) processarArquivoExcel(e.target.files[0]);
});

function processarArquivoExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const linhasJson = XLSX.utils.sheet_to_json(worksheet);
        
        let nomeArquivo = file.name.replace('.xlsx', '').replace('.csv', '');
        let partesNome = nomeArquivo.split('-'); 
        
        let estudante = partesNome[0] ? partesNome[0].trim() : "Estudante Não Identificado";
        let turma = partesNome[1] ? partesNome[1].replace('(respostas)', '').trim() : "Turma Não Identificada";

        document.getElementById('nome-estudante').textContent = estudante;
        document.getElementById('turma-estudante').textContent = turma;
        localStorage.setItem('estudanteAtual', estudante);
        localStorage.setItem('turmaAtual', turma);

        gerarTextoDinamico(estudante, turma, linhasJson);
        
        document.getElementById('painel').style.display = "flex";
        dropZone.innerHTML = "✅ Arquivo processado com sucesso! Arraste outro se desejar atualizar.";
        dropZone.style.backgroundColor = "#e6fffa"; dropZone.style.color = "#047857"; dropZone.style.borderColor = "#10b981";
    };
    reader.readAsArrayBuffer(file);
}

// ==========================================
// MÓDULO 2: BANCO SEMÂNTICO NARRATIVO
// ==========================================

const conAbertura = [
    "Segundo os apontamentos da Docente X,",
    "Conforme as observações registradas pela Docente X,",
    "De acordo com a avaliação da Docente X,",
    "Na perspectiva da Docente X,",
    "Pelos registros pedagógicos da Docente X,",
    "Com base no relato da Docente X,"
];

// O Sujeito sempre vem acompanhado de um verbo de ação (Simulando o teu texto)
const conElocucaoNormal = [
    "a educadora relata que", "a professora menciona que", 
    "a docente destaca que", "a educadora enfatiza que", 
    "a professora pontua que"
];
// Para quando houver necessidade de quebrar frases longas (Ex: "Ela ainda acrescenta que")
const conElocucaoAdicional = [
    "A docente acrescenta ainda que", "A educadora também ressalta que", 
    "Ela ainda relata que", "A professora complementa dizendo que", 
    "Acrescenta ainda que"
];

const conSoma = ["Além disso,", "Outrossim,", "Ademais,", "Como também,", "Da mesma forma,", "Em adição,"];
const conContraste = ["Todavia,", "Contudo,", "Entretanto,", "No entanto,", "Apesar disso,"];
const conFinalidade = ["Com a intenção de", "Com a finalidade de", "Com o fito de", "A fim de"];

function sortear(lista, historico) {
    let disponiveis = lista.filter(c => !historico.includes(c));
    if (disponiveis.length === 0) disponiveis = lista; // Reseta o histórico se gastar tudo
    let sorteado = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    historico.push(sorteado);
    return sorteado;
}

function limparTexto(texto) {
    let t = String(texto).trim();
    t = t.replace(/\s+/g, ' '); 
    t = t.replace(/\s+,/g, ','); 
    t = t.replace(/\s+\./g, '.'); 
    t = t.replace(/[.!?]+$/, ''); 
    // Correções vitais
    t = t.replace(/\bas vezes\b/gi, 'às vezes'); 
    t = t.replace(/\bcomportar-se\b/gi, 'comporta-se'); 
    // Torna a primeira letra minúscula, exceto se for "Se" ou se começar com letra já minúscula
    if(t.length > 0 && t.charAt(0) !== t.charAt(0).toLowerCase()){
        t = t.charAt(0).toLowerCase() + t.slice(1);
    }
    return t;
}

function analisarResposta(textoOriginal) {
    let limpo = limparTexto(textoOriginal);
    let comparativo = limpo.toLowerCase().replace(/[^a-záéíóúãõç\s]/g, '').trim();
    const vazios = ["nao ha", "nada a declarar", "nada", "nenhuma", "nenhum"];
    
    return {
        textoLimpo: limpo,
        isVazio: vazios.includes(comparativo) || comparativo === "",
        isSim: (comparativo === "sim" || comparativo === "sempre" || comparativo === "com certeza"),
        isNao: (comparativo === "nao" || comparativo === "não" || comparativo === "nunca"),
        isAsVezes: (comparativo === "as vezes" || comparativo === "às vezes" || comparativo === "quase sempre" || comparativo === "parcialmente")
    };
}

// ==========================================
// MÓDULO 3: ENGENHARIA SINTÁTICA NARRATIVA
// ==========================================
function gerarTextoDinamico(estudante, turma, linhas) {
    const caixaTexto = document.getElementById('caixa-texto');
    
    let texto = `<p style="text-indent: 30px; text-align: justify; line-height: 1.6;">O presente relatório consolida a observação analítica do corpo docente acerca do desenvolvimento escolar e sociocomportamental do(a) estudante <strong>${estudante}</strong>, regularmente matriculado(a) na turma ${turma}. O escopo deste documento visa registrar, de forma criteriosa e transparente, as informações pedagógicas coletadas no período, resguardando a identidade dos profissionais avaliadores mediante numeração sequencial.</p>`;

    let contadorDocentes = 1;
    let aberturasUsadas = []; 

    linhas.forEach(linha => {
        let perguntas = Object.keys(linha).filter(c => !c.toLowerCase().includes('data/hora') && !c.toLowerCase().includes('professor'));
        if (perguntas.length === 0) return;

        let trechos = [];
        let historicoConectivos = []; 
        let historicoElocucao = [];
        
        let falouFrequencia = false;
        let falouAtividades = false;
        let falouGrupo = false;

        perguntas.forEach((pergunta) => {
            let analise = analisarResposta(linha[pergunta]);
            let pergMin = pergunta.toLowerCase();
            if (analise.isVazio) return;

            let parte = "";
            let txt = analise.textoLimpo;

            if (pergMin.includes("frequente") || pergMin.includes("frequência")) {
                if(falouFrequencia) return;
                if (analise.isSim) parte = "o estudante mantém assiduidade regular nas aulas";
                else if (analise.isNao) parte = "o estudante registra um índice preocupante de infrequência";
                else if (analise.isAsVezes) parte = "o estudante apresenta uma frequência irregular e oscilante";
                else parte = `em relação à assiduidade, ${txt}`;
                falouFrequencia = true;
            }
            else if (pergMin.includes("atividades") && !pergMin.includes("grupo")) {
                if(falouAtividades) return;
                if (analise.isSim) parte = "cumpre com todas as atividades propostas";
                else if (analise.isNao) parte = "apresenta resistência e não executa as tarefas solicitadas";
                else if (analise.isAsVezes) parte = "realiza as atividades propostas apenas ocasionalmente";
                else parte = `quanto às tarefas, ${txt}`;
                falouAtividades = true;
            }
            else if (pergMin.includes("convivência") || pergMin.includes("grupo") || pergMin.includes("colegas") || pergMin.includes("participa")) {
                if(falouGrupo) return;
                if (analise.isSim) parte = "sobre a socialização e participação, participa ativamente das aulas e apresenta excelente convívio social";
                else if (analise.isNao) parte = "sobre a socialização e participação, demonstra resistência nas interações e trabalhos em grupo";
                else if (analise.isAsVezes) parte = "sobre a socialização e participação, envolve-se nas dinâmicas coletivas de forma pontual e restrita";
                else parte = `sobre a socialização e participação, ${txt}`;
                falouGrupo = true;
            }
            else if (pergMin.includes("desempenho") || pergMin.includes("aprendizado") || pergMin.includes("comportamento")) {
                // Ao invés de vírgula, este bloco usa a quebra de sentença de elocução: "Acrescenta ainda que..."
                parte = `[QUEBRA] o estudante ${txt}`;
            }
            else if (pergMin.includes("chame a atenção") || pergMin.includes("fato") || pergMin.includes("relate")) {
                if (analise.isSim || analise.isNao || analise.isAsVezes) return; 
                parte = `[RESSALVA] ${txt}`; // Marcação para gerar o "Além disso, ressalta que" ou "A docente ressalta que"
            }
            else {
                if (analise.isSim) parte = `afirma positivamente sobre este quesito`;
                else if (analise.isNao) parte = `pontua um retorno negativo para este tópico`;
                else if (analise.isAsVezes) parte = `observa que a ocorrência se dá de forma parcial`;
                else parte = `complementa que ${txt}`;
            }

            if(parte !== "") trechos.push(parte);
        });

        // -------------------------------------------------------------
        // CONSTRUTOR NARRATIVO DO PARÁGRAFO (O modelo do Professor Carlos)
        // -------------------------------------------------------------
        if (trechos.length > 0) {
            let cAbertura = sortear(conAbertura, aberturasUsadas).replace('X', contadorDocentes);
            let paragrafo = `${cAbertura} ${trechos[0]}`; // Ex: "Pelos registros da Docente 1, o estudante mantém assiduidade..."

            for (let i = 1; i < trechos.length; i++) {
                let txtAtual = trechos[i];

                if (txtAtual.includes("[RESSALVA]")) {
                    txtAtual = txtAtual.replace("[RESSALVA]", "").trim();
                    let elocucaoFinal = (i % 2 === 0) ? "A docente ressalta que" : "Além disso, a educadora ressalta que";
                    paragrafo += `. ${elocucaoFinal} ${txtAtual}`;
                } 
                else if (txtAtual.includes("[QUEBRA]")) {
                    txtAtual = txtAtual.replace("[QUEBRA]", "").trim();
                    let elocucaoQuebra = sortear(conElocucaoAdicional, historicoElocucao);
                    paragrafo += `. ${elocucaoQuebra} ${txtAtual}`;
                } 
                else {
                    let ehNegativo = txtAtual.toLowerCase().match(/(resistência|infrequência|irregular|dificuldade|pouco|desinteresse|não executa|apenas ocasionalmente|negativo)/);
                    let conectivo = ehNegativo ? sortear(conContraste, historicoConectivos) : sortear(conSoma, historicoConectivos);
                    let vozNarativa = sortear(conElocucaoNormal, historicoElocucao);
                    
                    paragrafo += `. ${conectivo} ${vozNarativa} ${txtAtual}`;
                }
            }
            
            paragrafo += `.`; 
            // Conserta duplos espaços ou pontos que possam ter passado na montagem
            paragrafo = paragrafo.replace(/\s+/g, ' ').replace(/\.\./g, '.');
            texto += `<p style="text-indent: 30px; text-align: justify; line-height: 1.6;">${paragrafo}</p>`;
            contadorDocentes++;
        }
    });

    // -------------------------------------------------------------
    // NOVO FECHAMENTO PEDAGÓGICO (O Modelo da Mestra Aurora)
    // -------------------------------------------------------------
    let cFinal = sortear(conFinalidade, []);
    texto += `<p style="text-indent: 30px; text-align: justify; line-height: 1.6;">${cFinal} garantir a evolução do discente, a equipe pedagógica reitera que sempre está motivando e orientando o estudante em relação às suas necessidades pedagógicas. No mais, colocamo-nos à inteira disposição da família e demais interessados para eventuais esclarecimentos e alinhamentos de estratégias conjuntas.</p>`;

    caixaTexto.innerHTML = texto;
}
