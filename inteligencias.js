// ==========================================
// MÓDULO DE LEITURA DE EXCEL (DRAG & DROP)
// ==========================================

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

// Efeitos visuais ao arrastar
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

// Aciona a leitura se clicar na caixa
dropZone.addEventListener('click', () => fileInput.click());

// Leitura ao soltar o arquivo
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        processarArquivoExcel(e.dataTransfer.files[0]);
    }
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        processarArquivoExcel(e.target.files[0]);
    }
});

// A Função Mágica que processa o Excel
function processarArquivoExcel(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        
        // Pega a primeira aba da planilha
        const primeiraAba = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[primeiraAba];
        
        // Converte as linhas em dados para o sistema (array de objetos)
        const linhasJson = XLSX.utils.sheet_to_json(worksheet);
        
        // Descobre o nome do aluno e turma lendo o nome do arquivo!
        // Exemplo esperado: "CARLOS HENRIQUE MOTA LEITE- 6º REG 2 (respostas).xlsx"
        let nomeArquivo = file.name.replace('.xlsx', '').replace('.csv', '');
        let partesNome = nomeArquivo.split('-'); 
        
        let estudante = partesNome[0] ? partesNome[0].trim() : "Estudante Não Identificado";
        let turma = partesNome[1] ? partesNome[1].replace('(respostas)', '').trim() : "Turma Não Identificada";

        // Preenche o cabeçalho
        document.getElementById('nome-estudante').textContent = estudante;
        document.getElementById('turma-estudante').textContent = turma;
        
        // Salva os dados no navegador para a Etiqueta também poder usar depois
        localStorage.setItem('estudanteAtual', estudante);
        localStorage.setItem('turmaAtual', turma);

        // Envia as linhas para a Inteligência de Texto gerar o relatório
        gerarTexto(estudante, turma, linhasJson);
        
        // Mostra o painel de impressão
        document.getElementById('painel').style.display = "flex";
        dropZone.innerHTML = "✅ Arquivo processado com sucesso! Arraste outro se quiser trocar.";
        dropZone.style.backgroundColor = "#e6fffa";
        dropZone.style.color = "#047857";
        dropZone.style.borderColor = "#10b981";
    };
    
    reader.readAsArrayBuffer(file);
}

// ==========================================
// MÓDULO DE ENGENHARIA DE TEXTO (GRAMÁTICA)
// ==========================================
function gerarTexto(estudante, turma, linhas) {
    const caixaTexto = document.getElementById('caixa-texto');
    
    let texto = `<p>O presente relatório consolida a observação analítica do corpo docente acerca do desenvolvimento escolar e sociocomportamental do estudante <strong>${estudante}</strong>, atualmente matriculado na turma ${turma}. O escopo deste documento visa registrar de forma criteriosa as potencialidades, bem como os desafios de aprendizagem demonstrados no período, resguardando a identidade dos professores mediante numeração sequencial.</p>`;

    let contadorDocentes = 1;

    linhas.forEach(linha => {
        // Pega as colunas da planilha (usando as chaves dinâmicas porque os títulos podem variar um pouco)
        let chaves = Object.keys(linha);
        
        // Tenta achar as colunas pelas palavras chaves do seu Forms
        let freqText = String(linha[chaves.find(c => c.includes('frequente'))] || "Não informado");
        let convText = String(linha[chaves.find(c => c.includes('convivência'))] || "Não informado");
        let desempText = String(linha[chaves.find(c => c.includes('desempenho'))] || "Não informado");
        let extraText = String(linha[chaves.find(c => c.includes('atenção'))] || "");

        // Pula se a linha for vazia
        if(freqText === "Não informado" && convText === "Não informado") return;

        let paragrafo = `Segundo os apontamentos da Docente ${contadorDocentes}, `;
        
        // Frequência
        if(freqText.toLowerCase().includes('sim') || freqText.toLowerCase().includes('frequente')) {
            paragrafo += "o estudante mantém assiduidade regular nas aulas. ";
        } else {
            paragrafo += `em relação à assiduidade, observou-se que ${freqText.toLowerCase()}. `;
        }

        // Convivência
        paragrafo += `No tocante à socialização e convívio na turma, a docente relata que ${convText}. `;

        // Desempenho (Análise sintática para conectivos)
        const perf = desempText.toLowerCase();
        if (perf.includes("mas") || perf.includes("contudo") || perf.includes("entretanto")) {
            paragrafo += `Quanto ao desempenho acadêmico e comportamental, destaca-se que ${desempText}.`;
        } 
        else if (perf.includes("dificuldade") || perf.includes("lento") || perf.includes("não realiza")) {
            paragrafo += `Por outro lado, no aspecto pedagógico, pontua-se que o aluno ${desempText}.`;
        } 
        else {
            paragrafo += `Ademais, no eixo da aprendizagem, nota-se que ${desempText}.`;
        }

        // Fato extra (se existir)
        if (extraText && extraText.length > 3) {
            paragrafo += ` Vale ressaltar ainda que ${extraText}.`;
        }

        texto += `<p>${paragrafo}</p>`;
        contadorDocentes++;
    });

    texto += `<p>Diante do quadro exposto, a equipe pedagógica reitera a necessidade de acompanhamento. Colocamo-nos à inteira disposição para eventuais esclarecimentos e alinhamentos de estratégias intervencionistas conjuntas.</p>`;

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
