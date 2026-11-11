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
// MÓDULO 2: FERRAMENTAS GRAMATICAIS
// ==========================================

// Lista de conectivos variados para evitar a síndrome do "Ademais"
const conectivosMeio = [
    "Além disso,", "Somado a isso,", "Outro ponto a destacar é que",
    "Nota-se também que", "No que tange aos demais aspectos,", "Ademais,"
];

// Limpeza de erros comuns de digitação dos professores
function limparTexto(texto) {
    let t = String(texto).trim();
    t = t.replace(/\s+/g, ' '); // Tira espaços duplos
    t = t.replace(/\s+,/g, ','); // Arruma " , " para ","
    t = t.replace(/\s+\./g, '.'); // Arruma " . " para "."
    t = t.replace(/[.!?]+$/, ''); // Tira a pontuação final (o sistema vai colocar a dele)
    // Correções de vícios comuns (Ex: "as vezes" para "às vezes")
    t = t.replace(/\bas vezes\b/gi, 'às vezes'); 
    t = t.replace(/\bcomportar-se\b/gi, 'comporta-se'); 
    
    return t;
}

// Identificador universal de respostas curtas/vazias
function analisarResposta(textoOriginal) {
    let limpo = limparTexto(textoOriginal);
    let comparativo = limpo.toLowerCase().replace(/[^a-záéíóúãõç\s]/g, '').trim();
    
    // Lista de negações e vazios que devem ser ignorados do relatório
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
        let conectivosCopia = [...conectivosMeio]; // Cópia dos conectivos para sortear e apagar (não repetir)
        
        // Memória para evitar frases duplicadas
        let falouFrequencia = false;
        let falouAtividades = false;
        let falouGrupo = false;

        perguntas.forEach((pergunta) => {
            let analise = analisarResposta(linha[pergunta]);
            let pergMin = pergunta.toLowerCase();

            if (analise.isVazio) return;

            let parte = "";
            let primeiraLetraMin = analise.textoLimpo.charAt(0).toLowerCase() + analise.textoLimpo.slice(1);

            // TÓPICO: FREQUÊNCIA
            if (pergMin.includes("frequente") || pergMin.includes("frequência")) {
                if(falouFrequencia) return; // Evita duplicar
                if (analise.isSim) parte = "o estudante mantém assiduidade regular nas aulas";
                else if (analise.isNao) parte = "registra-se um índice preocupante de infrequência";
                else if (analise.isAsVezes) parte = "apresenta uma frequência irregular e oscilante";
                else parte = `em relação à assiduidade, nota-se que ${primeiraLetraMin}`;
                falouFrequencia = true;
            }
            
            // TÓPICO: ATIVIDADES
            else if (pergMin.includes("atividades") && !pergMin.includes("grupo")) {
                if(falouAtividades) return;
                if (analise.isSim) parte = "cumpre com todas as atividades propostas";
                else if (analise.isNao) parte = "apresenta resistência e não executa as tarefas solicitadas";
                else if (analise.isAsVezes) parte = "realiza as atividades propostas apenas ocasionalmente";
                else parte = `quanto às tarefas, observa-se que ${primeiraLetraMin}`;
                falouAtividades = true;
            }

            // TÓPICO: CONVIVÊNCIA / GRUPO
            else if (pergMin.includes("convivência") || pergMin.includes("grupo") || pergMin.includes("colegas")) {
                if(falouGrupo) return;
                if (analise.isSim) parte = "participa ativamente das aulas e apresenta excelente convívio social";
                else if (analise.isNao) parte = "demonstra resistência nas interações e trabalhos em grupo";
                else if (analise.isAsVezes) parte = "envolve-se nas dinâmicas coletivas de forma pontual e restrita";
                else parte = `no tocante à socialização, a docente relata que ${primeiraLetraMin}`;
                falouGrupo = true;
            }

            // TÓPICO: DESEMPENHO E COMPORTAMENTO GERAL
            else if (pergMin.includes("desempenho") || pergMin.includes("aprendizado") || pergMin.includes("comportamento")) {
                parte = `no âmbito acadêmico e comportamental, ${primeiraLetraMin}`;
            }

            // TÓPICO: OBSERVAÇÕES EXTRAS (Fatos que chamam atenção)
            else if (pergMin.includes("chame a atenção") || pergMin.includes("fato") || pergMin.includes("relate")) {
                // Se o professor colocar só "Sim" no campo de observação sem explicar nada, descartamos.
                if (analise.isSim || analise.isNao || analise.isAsVezes) return; 
                parte = `vale ressaltar que ${primeiraLetraMin}`;
            }
            
            // TÓPICO GENÉRICO (Se você criar uma pergunta nova amanhã)
            else {
                if (analise.isSim) parte = `houve um retorno afirmativo em relação a este quesito`;
                else if (analise.isNao) parte = `pontuou-se um retorno negativo para este tópico`;
                else if (analise.isAsVezes) parte = `observou-se que a ocorrência se dá de forma parcial`;
                else parte = `pontuou-se também que ${primeiraLetraMin}`;
            }

            if(parte !== "") trechos.push(parte);
        });

        // CONSTRUÇÃO COESIVA DO PARÁGRAFO DO DOCENTE
        if (trechos.length > 0) {
            let paragrafo = `Segundo os apontamentos da Docente ${contadorDocentes}, ${trechos[0]}`; // Abertura

            for (let i = 1; i < trechos.length; i++) {
                // Sorteia um conectivo e remove da lista para não repetir logo em seguida
                let indexConectivo = Math.floor(Math.random() * conectivosMeio.length);
                let conectivo = conectivosCopia.length > 0 ? conectivosCopia.splice(indexConectivo, 1)[0] : "Ademais,";

                if (i === trechos.length - 1) { // É a última frase?
                    if (trechos[i].includes("vale ressaltar")) {
                        paragrafo += `. ${trechos[i].charAt(0).toUpperCase() + trechos[i].slice(1)}`;
                    } else {
                        paragrafo += `. Por fim, ${trechos[i]}`;
                    }
                } else {
                    paragrafo += `. ${conectivo} ${trechos[i]}`;
                }
            }
            
            paragrafo += `.`; // Ponto final obrigatório
            texto += `<p style="text-indent: 30px; text-align: justify; line-height: 1.6;">${paragrafo}</p>`;
            contadorDocentes++;
        }
    });

    texto += `<p style="text-indent: 30px; text-align: justify; line-height: 1.6;">Diante do quadro consolidado, a equipe pedagógica reitera a importância do acompanhamento constante. Colocamo-nos à inteira disposição da família e demais interessados para eventuais esclarecimentos e alinhamentos de estratégias conjuntas.</p>`;

    caixaTexto.innerHTML = texto;
}

// Inicializa a Data
document.addEventListener('DOMContentLoaded', () => {
    const dataElement = document.getElementById('data-atual');
    if(dataElement) {
        const dataStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        dataElement.textContent = `Carbonita - MG, ${dataStr}.`;
    }
});
