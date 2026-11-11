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
// MÓDULO 2: BANCO SEMÂNTICO (O CÉREBRO HUMANO)
// ==========================================

const conAbertura = [
    "Segundo os apontamentos da Docente X,",
    "Conforme as observações registradas pela Docente X,",
    "De acordo com a avaliação da Docente X,",
    "Na perspectiva da Docente X,",
    "Pelos registros pedagógicos da Docente X,",
    "Com base no relato da Docente X,"
];

// Verbos de Elocução (Para simular a voz de quem narra)
const verbosElocucao = [
    "relata que", "menciona que", "acrescenta que", 
    "destaca que", "pontua que", "enfatiza que", "observa que"
];
const sujeitosElocucao = ["a educadora", "a docente", "a professora"];

const conSoma = ["Além disso,", "Outrossim,", "Ademais,", "Como também,", "Da mesma forma,", "Em adição,"];
const conContraste = ["Porém,", "Todavia,", "Contudo,", "Entretanto,", "No entanto,", "Apesar disso,"];
const conConclusao = ["Portanto,", "Logo,", "Por isso,", "Dessa forma,", "Desse modo,", "Em síntese,"];
const conFinalidade = ["Com a finalidade de", "Com o fito de", "Com o objetivo de", "Com a intenção de"];
const conCerteza = ["Certamente,", "Seguramente,", "Sem dúvida,", "Decerto,", "Com toda a certeza,"];

function sortear(lista, historico) {
    let disponiveis = lista.filter(c => !historico.includes(c));
    if (disponiveis.length === 0) disponiveis = lista; // Reseta se esgotar
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
    t = t.replace(/\bas vezes\b/gi, 'às vezes'); 
    t = t.replace(/\bcomportar-se\b/gi, 'comporta-se'); 
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
// MÓDULO 3: ENGENHARIA SINTÁTICA AVANÇADA
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
        let historicoVerbos = [];
        let historicoSujeitos = [];
        
        let falouFrequencia = false;
        let falouAtividades = false;
        let falouGrupo = false;

        perguntas.forEach((pergunta) => {
            let analise = analisarResposta(linha[pergunta]);
            let pergMin = pergunta.toLowerCase();

            if (analise.isVazio) return;

            let parte = "";
            let primeiraLetraMin = analise.textoLimpo.charAt(0).toLowerCase() + analise.textoLimpo.slice(1);

            // Preparação dos blocos predicativos (sem repetir o sujeito)
            if (pergMin.includes("frequente") || pergMin.includes("frequência")) {
                if(falouFrequencia) return;
                if (analise.isSim) parte = "mantém assiduidade regular nas aulas";
                else if (analise.isNao) parte = "registra um índice preocupante de infrequência";
                else if (analise.isAsVezes) parte = "apresenta uma frequência irregular e oscilante";
                else parte = `em relação à assiduidade, ${primeiraLetraMin}`;
                falouFrequencia = true;
            }
            else if (pergMin.includes("atividades") && !pergMin.includes("grupo")) {
                if(falouAtividades) return;
                if (analise.isSim) parte = "cumpre com todas as atividades propostas";
                else if (analise.isNao) parte = "apresenta resistência e não executa as tarefas solicitadas";
                else if (analise.isAsVezes) parte = "realiza as atividades propostas apenas ocasionalmente";
                else parte = `quanto às tarefas, ${primeiraLetraMin}`;
                falouAtividades = true;
            }
            else if (pergMin.includes("convivência") || pergMin.includes("grupo") || pergMin.includes("colegas") || pergMin.includes("participa")) {
                if(falouGrupo) return;
                if (analise.isSim) parte = "participa ativamente das aulas e apresenta excelente convívio social";
                else if (analise.isNao) parte = "demonstra resistência nas interações e trabalhos em grupo";
                else if (analise.isAsVezes) parte = "envolve-se nas dinâmicas coletivas de forma pontual e restrita";
                else parte = `sobre a socialização e participação, ${primeiraLetraMin}`;
                falouGrupo = true;
            }
            else if (pergMin.includes("desempenho") || pergMin.includes("aprendizado") || pergMin.includes("comportamento")) {
                parte = `no âmbito acadêmico e comportamental, ${primeiraLetraMin}`;
            }
            else if (pergMin.includes("chame a atenção") || pergMin.includes("fato") || pergMin.includes("relate")) {
                if (analise.isSim || analise.isNao || analise.isAsVezes) return; 
                parte = `vale ressaltar que ${primeiraLetraMin}`;
            }
            else {
                if (analise.isSim) parte = `afirma positivamente sobre este quesito`;
                else if (analise.isNao) parte = `pontua um retorno negativo para este tópico`;
                else if (analise.isAsVezes) parte = `observa que a ocorrência se dá de forma parcial`;
                else parte = `complementa que ${primeiraLetraMin}`;
            }

            if(parte !== "") trechos.push(parte);
        });

        if (trechos.length > 0) {
            // Abertura primorosa: "Conforme as observações da Docente 1, o estudante..."
            let cAbertura = sortear(conAbertura, aberturasUsadas).replace('X', contadorDocentes);
            let paragrafo = `${cAbertura} o estudante ${trechos[0]}`; 

            for (let i = 1; i < trechos.length; i++) {
                let trechoAtual = trechos[i];
                let ehNegativo = trechoAtual.toLowerCase().match(/(resistência|infrequência|irregular|dificuldade|pouco|desinteresse|não executa|apenas ocasionalmente|negativo)/);

                if (i === trechos.length - 1 && !trechoAtual.includes("vale ressaltar")) { 
                    // Fechamento de parágrafo da professora
                    let cConc = sortear(conConclusao, historicoConectivos);
                    let sujEloc = sortear(sujeitosElocucao, historicoSujeitos);
                    let vEloc = sortear(verbosElocucao, historicoVerbos);
                    
                    // Tratamento rigoroso de vírgulas para expressões de deslocamento adverbial
                    let virgula = (trechoAtual.startsWith("em ") || trechoAtual.startsWith("no ") || trechoAtual.startsWith("na ") || trechoAtual.startsWith("sobre ") || trechoAtual.startsWith("quanto ")) ? "," : "";
                    
                    paragrafo += `. ${cConc} ${sujEloc} ${vEloc}${virgula} ${trechoAtual}`;
                } 
                else if (trechoAtual.includes("vale ressaltar")) {
                    paragrafo += `. ${trechoAtual.charAt(0).toUpperCase() + trechoAtual.slice(1)}`;
                }
                else { 
                    // Frases de ligação no meio do parágrafo
                    let conectivo = ehNegativo ? sortear(conContraste, historicoConectivos) : sortear(conSoma, historicoConectivos);
                    let sujEloc = sortear(sujeitosElocucao, historicoSujeitos);
                    let vEloc = sortear(verbosElocucao, historicoVerbos);
                    
                    let virgula = (trechoAtual.startsWith("em ") || trechoAtual.startsWith("no ") || trechoAtual.startsWith("na ") || trechoAtual.startsWith("sobre ") || trechoAtual.startsWith("quanto ")) ? "," : "";

                    paragrafo += `. ${conectivo} ${sujEloc} ${vEloc}${virgula} ${trechoAtual}`;
                }
            }
            
            paragrafo += `.`; 
            texto += `<p style="text-indent: 30px; text-align: justify; line-height: 1.6;">${paragrafo}</p>`;
            contadorDocentes++;
        }
    });

    // Encerramento Padrão com Conectivos do Usuário
    let cFinal = sortear(conFinalidade, []);
    let cCerteza = sortear(conCerteza, []);

    texto += `<p style="text-indent: 30px; text-align: justify; line-height: 1.6;">${cFinal} garantir a evolução do discente, a equipe pedagógica reitera a importância do acompanhamento constante. ${cCerteza} colocamo-nos à inteira disposição da família e demais interessados para eventuais esclarecimentos e alinhamentos de estratégias conjuntas.</p>`;

    caixaTexto.innerHTML = texto;
}

document.addEventListener('DOMContentLoaded', () => {
    const dataElement = document.getElementById('data-atual');
    if(dataElement) {
        const dataStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        dataElement.textContent = `Carbonita - MG, ${dataStr}.`;
    }
});
