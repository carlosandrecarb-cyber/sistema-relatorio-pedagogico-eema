// ==========================================
// LEITURA DE EXCEL (DRAG & DROP)
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
// ENGENHARIA DE TEXTO DINÂMICA E GRAMATICAL
// ==========================================
function gerarTextoDinamico(estudante, turma, linhas) {
    const caixaTexto = document.getElementById('caixa-texto');
    
    let texto = `<p style="text-indent: 30px;">O presente relatório consolida a observação analítica do corpo docente acerca do desenvolvimento escolar e sociocomportamental do(a) estudante <strong>${estudante}</strong>, regularmente matriculado(a) na turma ${turma}. O escopo deste documento visa registrar, de forma criteriosa e transparente, as informações pedagógicas coletadas no período, resguardando a identidade dos profissionais avaliadores mediante numeração sequencial.</p>`;

    let contadorDocentes = 1;

    linhas.forEach(linha => {
        let chaves = Object.keys(linha);
        let perguntas = chaves.filter(c => !c.toLowerCase().includes('data/hora') && !c.toLowerCase().includes('professor'));
        
        if (perguntas.length === 0) return;

        let paragrafo = `Segundo os apontamentos da Docente ${contadorDocentes}, `;
        let trechos = []; // Guarda as partes para unir com conectivos no final

        perguntas.forEach((pergunta) => {
            let resposta = linha[pergunta] ? String(linha[pergunta]).trim() : "";
            let respMin = resposta.toLowerCase();
            let pergMin = pergunta.toLowerCase();

            // Pula se não houver resposta válida
            if (!resposta || resposta === "-" || respMin === "nada a declarar" || respMin === "não há" || respMin === "não há nada a declarar") return;

            // Formatação inicial: remove ponto final duplicado e garante minúscula no meio da frase se for sim/não
            resposta = resposta.replace(/[.!?]$/, '');
            
            let parteConstruida = "";

            // Lógica 1: Frequência
            if (pergMin.includes("frequente")) {
                if (respMin === "sim") {
                    parteConstruida = "o estudante mantém assiduidade regular nas aulas";
                } else if (respMin === "não") {
                    parteConstruida = "registra-se um índice preocupante de infrequência";
                } else {
                    parteConstruida = `em relação à assiduidade, ${resposta.charAt(0).toLowerCase() + resposta.slice(1)}`;
                }
            }
            
            // Lógica 2: Cumprimento de Atividades
            else if (pergMin.includes("atividades") && !pergMin.includes("grupo")) {
                if (respMin === "sim") {
                    parteConstruida = "cumpre com todas as atividades propostas";
                } else if (respMin.includes("quase")) {
                    parteConstruida = "realiza a maior parte das atividades solicitadas";
                } else if (respMin === "não") {
                    parteConstruida = "apresenta resistência na execução das atividades";
                } else {
                    parteConstruida = `quanto às tarefas, observa-se que ${resposta.charAt(0).toLowerCase() + resposta.slice(1)}`;
                }
            }

            // Lógica 3: Participação / Grupo
            else if (pergMin.includes("participa") || pergMin.includes("grupo")) {
                if (respMin === "sim") {
                    parteConstruida = "participa ativamente das aulas e dos trabalhos em grupo";
                } else if (respMin.includes("não")) {
                    parteConstruida = "demonstra pouca ou nenhuma participação nas dinâmicas coletivas";
                } else {
                    parteConstruida = `sobre a participação, nota-se que ${resposta.charAt(0).toLowerCase() + resposta.slice(1)}`;
                }
            }

            // Lógica 4: Desempenho e Comportamento Geral (A resposta costuma ser longa)
            else if (pergMin.includes("desempenho") || pergMin.includes("comportamento")) {
                parteConstruida = `no âmbito do desenvolvimento e do convívio, destaca-se que ${resposta.charAt(0).toLowerCase() + resposta.slice(1)}`;
            }

            // Lógica 5: Observações Extras
            else if (pergMin.includes("chame a atenção") || pergMin.includes("fato")) {
                parteConstruida = `vale ressaltar que ${resposta.charAt(0).toLowerCase() + resposta.slice(1)}`;
            }
            
            // Caso genérico se a pergunta mudar no futuro
            else {
                parteConstruida = `pontuou-se também que ${resposta.charAt(0).toLowerCase() + resposta.slice(1)}`;
            }

            if(parteConstruida) trechos.push(parteConstruida);
        });

        // Junta os trechos com conectivos adequados
        if (trechos.length > 0) {
            for (let i = 0; i < trechos.length; i++) {
                if (i === 0) {
                    paragrafo += trechos[i];
                } else if (i === trechos.length - 1) {
                    // Último item usa "Por fim" ou "Além disso"
                    if (trechos[i].includes("vale ressaltar")) {
                        paragrafo += `. ${trechos[i].charAt(0).toUpperCase() + trechos[i].slice(1)}`;
                    } else {
                        paragrafo += `, e, por fim, ${trechos[i]}`;
                    }
                } else {
                    paragrafo += `. Ademais, ${trechos[i]}`;
                }
            }
            paragrafo += `.`; // Finaliza o parágrafo do professor
            texto += `<p style="text-indent: 30px;">${paragrafo}</p>`;
            contadorDocentes++;
        }
    });

    texto += `<p style="text-indent: 30px;">Diante do quadro consolidado, a equipe pedagógica reitera a importância do acompanhamento constante. Colocamo-nos à inteira disposição da família e demais interessados para eventuais esclarecimentos e alinhamentos de estratégias conjuntas.</p>`;

    caixaTexto.innerHTML = texto;
}

// Inicializa a Data
document.addEventListener('DOMContentLoaded', () => {
    const dataElement = document.getElementById('data-atual');
    if(dataElement) {
        const hoje = new Date();
        const opcoes = { day: '2-digit', month: 'long', year: 'numeric' };
        dataElement.textContent = `Carbonita - MG, ${hoje.toLocaleDateString('pt-BR', opcoes)}.`;
    }
});
