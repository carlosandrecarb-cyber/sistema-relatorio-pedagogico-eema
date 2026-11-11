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
        dropZone.innerHTML = "✅ Arquivo processado com sucesso! Arraste outro se quiser atualizar.";
        dropZone.style.backgroundColor = "#e6fffa"; dropZone.style.color = "#047857"; dropZone.style.borderColor = "#10b981";
    };
    reader.readAsArrayBuffer(file);
}

// ==========================================
// ENGENHARIA DE TEXTO DINÂMICA E GRAMATICAL
// ==========================================
function gerarTextoDinamico(estudante, turma, linhas) {
    const caixaTexto = document.getElementById('caixa-texto');
    
    let texto = `<p>O presente relatório consolida a observação analítica do corpo docente acerca do desenvolvimento escolar e sociocomportamental do(a) estudante <strong>${estudante}</strong>, regularmente matriculado(a) na turma ${turma}. O escopo deste documento visa registrar de forma criteriosa e transparente as informações pedagógicas coletadas no período, resguardando a identidade dos profissionais avaliadores mediante numeração sequencial.</p>`;

    let contadorDocentes = 1;

    linhas.forEach(linha => {
        let chaves = Object.keys(linha);
        
        // Filtra colunas ignorando carimbo de hora e nome do professor
        let perguntas = chaves.filter(c => !c.toLowerCase().includes('data/hora') && !c.toLowerCase().includes('professor'));
        
        if (perguntas.length === 0) return; // Pula se a linha estiver vazia

        let paragrafo = `Segundo os apontamentos da Docente ${contadorDocentes}, `;
        let respostasValidas = 0;

        perguntas.forEach((pergunta, index) => {
            let resposta = linha[pergunta] ? String(linha[pergunta]).trim() : "";
            
            // Ignora se a resposta for vazia ou traço
            if (!resposta || resposta === "-" || resposta.toLowerCase() === "nada a declarar") return;

            // Ajuste gramatical: garante que a frase termine com ponto final se o professor esqueceu
            if (!resposta.match(/[.!?]$/)) resposta += '.';
            
            // Ajuste gramatical: garante que a resposta comece com letra maiúscula
            resposta = resposta.charAt(0).toUpperCase() + resposta.slice(1);

            // Variação rica de conectivos dependendo do número da pergunta
            if (respostasValidas === 0) {
                paragrafo += `no que tange à questão "${pergunta}", relatou-se que: ${resposta} `;
            } else if (index === perguntas.length - 1) {
                paragrafo += `Por fim, acerca do questionamento "${pergunta}", a educadora pontuou que: ${resposta} `;
            } else {
                paragrafo += `Ademais, sobre o tópico "${pergunta}", observou-se que: ${resposta} `;
            }
            respostasValidas++;
        });

        if(respostasValidas > 0) {
            texto += `<p>${paragrafo}</p>`;
            contadorDocentes++;
        }
    });

    texto += `<p>Diante do quadro consolidado, a equipe pedagógica reitera a importância do acompanhamento constante. Colocamo-nos à inteira disposição da família e demais interessados para eventuais esclarecimentos e alinhamentos de estratégias conjuntas.</p>`;

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
