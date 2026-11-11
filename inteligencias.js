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
// MÓDULO 2: FERRAMENTAS GRAMATICAIS (BANCO DE CONECTIVOS)
// ==========================================

// 1. Conectivos de Soma/Adição (Para continuar o assunto)
const conSoma = [
    "Além disso,", "Outrossim,", "Ademais,", "Somado a isso,", 
    "Nota-se também que", "Vale acrescentar que", "Como também,"
];

// 2. Conectivos de Contraste/Contraposição (Quando a resposta for negativa/problema)
const conContraste = [
    "Por outro lado,", "Todavia,", "Contudo,", "Entretanto,", 
    "No entanto,", "Apesar disso,"
];

// 3. Conectivos de Conclusão/Finalização (Para fechar o parágrafo de cada professor)
const conConclusao = [
    "Em síntese,", "Dessa forma,", "Desse modo,", "Sendo assim,", 
    "Logo,", "Por conseguinte,"
];

// Função de sorteio para não repetir conectivos no mesmo parágrafo
function sortearConectivo(lista, historico) {
    let conectivosDisponiveis = lista.filter(c => !historico.includes(c));
    if (conectivosDisponiveis.length === 0) conectivosDisponiveis = lista; // Reseta se usar todos
    let sorteado = conectivosDisponiveis[Math.floor(Math.random() * conectivosDisponiveis.length)];
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
// MÓDULO 3: ENGENHARIA DE TEXTO AVANÇADA
// ==========================================
function gerarTextoDinamico(estudante, turma, linhas) {
    const caixaTexto = document.getElementById('caixa-texto');
    
    let texto = `<p style="text-indent: 30px; text-align: justify; line-height: 1.6;">O presente relatório consolida a observação analítica do corpo docente acerca do desenvolvimento escolar e sociocomportamental do(a) estudante <strong>${estudante}</strong>, regularmente matriculado(a) na turma ${turma}. O escopo deste documento visa registrar, de forma criteriosa e transparente, as informações pedagógicas coletadas no período, resguardando a identidade dos profissionais avaliadores mediante numeração sequencial.</p>`;

    let contadorDocentes = 1;

    linhas.forEach(linha => {
        let perguntas = Object.keys(linha).filter(c => !c.toLowerCase().includes('data/hora') && !c.toLowerCase().includes('professor'));
        if (perguntas.length === 0) return;

        let trechos = [];
        let conectivosUsados = []; // Memória para não repetir conectivos no mesmo parágrafo
        let temProblema = false; // Bandeira para saber se deve usar conectivo de contraste
        
        let falouFrequencia = false;
        let falouAtividades = false;
        let falouGrupo = false;

        perguntas.forEach((pergunta) => {
            let analise = analisarResposta(linha[pergunta]);
            let pergMin = pergunta.toLowerCase();

            if (analise.isVazio) return;

            let parte = "";
            let primeiraLetraMin = analise.textoLimpo.charAt(0).toLowerCase() + analise.textoLimpo.slice(1);

            // FREQUÊNCIA
            if (pergMin.includes("frequente") || pergMin.includes("frequência")) {
                if(falouFrequencia) return;
                if (analise.isSim) parte = "mantém assiduidade regular nas aulas";
                else if (analise.isNao) { parte = "registra um índice preocupante de infrequência"; temProblema = true; }
                else if (analise.isAsVezes) { parte = "apresenta uma frequência irregular e oscilante"; temProblema = true; }
                else parte = `em relação à assiduidade, ${primeiraLetraMin}`;
                falouFrequencia = true;
            }
            // ATIVIDADES
            else if (pergMin.includes("atividades") && !pergMin.includes("grupo")) {
                if(falouAtividades) return;
                if (analise.isSim) parte = "cumpre com todas as atividades propostas";
                else if (analise.isNao) { parte = "apresenta resistência e não executa as tarefas solicitadas"; temProblema = true; }
                else if (analise.isAsVezes) { parte = "realiza as atividades propostas apenas ocasionalmente"; temProblema = true; }
                else {
                    parte = `quanto às tarefas, observa-se que ${primeiraLetraMin}`;
                    if(analise.textoLimpo.toLowerCase().includes("dificuldade")) temProblema = true;
                }
                falouAtividades = true;
            }
            // GRUPO/PARTICIPAÇÃO
            else if (pergMin.includes("convivência") || pergMin.includes("grupo") || pergMin.includes("colegas") || pergMin.includes("participa")) {
                if(falouGrupo) return;
                if (analise.isSim) parte = "participa ativamente das aulas e apresenta excelente convívio social";
                else if (analise.isNao) { parte = "demonstra resistência nas interações e trabalhos em grupo"; temProblema = true; }
                else if (analise.isAsVezes) { parte = "envolve-se nas dinâmicas coletivas de forma pontual e restrita"; temProblema = true; }
                else {
                    parte = `no tocante à socialização e participação, a docente relata que ${primeiraLetraMin}`;
                    if(analise.textoLimpo.toLowerCase().includes("dificuldade") || analise.textoLimpo.toLowerCase().includes("pouco")) temProblema = true;
                }
                falouGrupo = true;
            }
            // DESEMPENHO E COMPORTAMENTO
            else if (pergMin.includes("desempenho") || pergMin.includes("aprendizado") || pergMin.includes("comportamento")) {
                parte = `no âmbito acadêmico e comportamental, ${primeiraLetraMin}`;
                if(analise.textoLimpo.toLowerCase().includes("dificuldade") || analise.textoLimpo.toLowerCase().includes("desinteresse")) temProblema = true;
            }
            // OBSERVAÇÕES EXTRAS
            else if (pergMin.includes("chame a atenção") || pergMin.includes("fato") || pergMin.includes("relate")) {
                if (analise.isSim || analise.isNao || analise.isAsVezes) return; 
                parte = `vale ressaltar que ${primeiraLetraMin}`;
            }
            // GENÉRICO
            else {
                if (analise.isSim) parte = `houve um retorno afirmativo em relação a este quesito`;
                else if (analise.isNao) { parte = `pontuou-se um retorno negativo para este tópico`; temProblema = true; }
                else if (analise.isAsVezes) parte = `observou-se que a ocorrência se dá de forma parcial`;
                else parte = `pontuou-se também que ${primeiraLetraMin}`;
            }

            if(parte !== "") trechos.push(parte);
        });

        // CONSTRUÇÃO COESIVA COM O NOVO BANCO DE CONECTIVOS
        if (trechos.length > 0) {
            let paragrafo = `Segundo os apontamentos da Docente ${contadorDocentes}, o estudante ${trechos[0]}`; 

            for (let i = 1; i < trechos.length; i++) {
                
                if (i === trechos.length - 1) { // Última frase
                    if (trechos[i].includes("vale ressaltar")) {
                        paragrafo += `. ${trechos[i].charAt(0).toUpperCase() + trechos[i].slice(1)}`;
                    } else {
                        let cConc = sortearConectivo(conConclusao, conectivosUsados);
                        paragrafo += `. ${cConc} nota-se que ${trechos[i]}`;
                    }
                } else { // Frases do meio
                    // Decide se usa um conectivo de SOMA ou de CONTRASTE baseado no tom da frase
                    let conectivo = "";
                    if (temProblema && i === 1) { 
                        // Se detectou problema na frase 2, usa um "Todavia" ou "Contudo"
                        conectivo = sortearConectivo(conContraste, conectivosUsados);
                        temProblema = false; // Desliga a bandeira para o resto do parágrafo ser de soma
                    } else {
                        // Senão, continua somando argumentos
                        conectivo = sortearConectivo(conSoma, conectivosUsados);
                    }
                    paragrafo += `. ${conectivo} ${trechos[i]}`;
                }
            }
            
            paragrafo += `.`; 
            texto += `<p style="text-indent: 30px; text-align: justify; line-height: 1.6;">${paragrafo}</p>`;
            contadorDocentes++;
        }
    });

    // Fechamento usando os conectivos da sua lista (ideia de finalidade e certeza)
    texto += `<p style="text-indent: 30px; text-align: justify; line-height: 1.6;">Com a finalidade de garantir a evolução do discente, a equipe pedagógica reitera a importância do acompanhamento constante. Decerto, colocamo-nos à inteira disposição da família e demais interessados para eventuais esclarecimentos e alinhamentos de estratégias conjuntas.</p>`;

    caixaTexto.innerHTML = texto;
}

document.addEventListener('DOMContentLoaded', () => {
    const dataElement = document.getElementById('data-atual');
    if(dataElement) {
        const dataStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        dataElement.textContent = `Carbonita - MG, ${dataStr}.`;
    }
});
