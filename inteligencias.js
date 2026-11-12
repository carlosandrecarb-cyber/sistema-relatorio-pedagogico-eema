document.addEventListener('DOMContentLoaded', () => {
    try {
        const dataStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        if(document.getElementById('data-atual')) document.getElementById('data-atual').textContent = `Carbonita - MG, ${dataStr}.`;
        if(document.getElementById('etiq-data')) document.getElementById('etiq-data').textContent = `Carbonita - MG, ${dataStr}.`;
        carregarSelectHistorico();
    } catch(e) { console.error("Erro na inicialização:", e); }
});

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.backgroundColor = '#d1e0f5'; });
dropZone.addEventListener('dragleave', () => dropZone.style.backgroundColor = '#eef3fa');
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); dropZone.style.backgroundColor = '#eef3fa';
    if (e.dataTransfer.files.length > 0) processarArquivo(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) processarArquivo(e.target.files[0]);
});

function mudarAba(aba) {
    document.getElementById('aba-relatorio').style.display = aba === 'relatorio' ? 'block' : 'none';
    document.getElementById('aba-etiqueta').style.display = aba === 'etiqueta' ? 'flex' : 'none';
    document.getElementById('btn-relatorio').className = aba === 'relatorio' ? 'aba-ativa' : 'aba-inativa';
    document.getElementById('btn-etiqueta').className = aba === 'etiqueta' ? 'aba-ativa' : 'aba-inativa';
}

function carregarSelectHistorico() {
    let db = {};
    try { db = JSON.parse(localStorage.getItem('eema_banco')) || {}; } catch(e) {}
    let select = document.getElementById('select-historico');
    if(!select) return;
    select.innerHTML = '<option value="">📂 Selecione um Aluno Salvo</option>';
    Object.keys(db).sort().forEach(nome => {
        let opt = document.createElement('option');
        opt.value = nome;
        opt.textContent = `${nome} (${db[nome].turma})`;
        select.appendChild(opt);
    });
}

function abrirAluno(estudante) {
    if(!estudante) return;
    let db = {};
    try { db = JSON.parse(localStorage.getItem('eema_banco')) || {}; } catch(e) {}
    let dados = db[estudante];
    if(!dados) return;

    document.getElementById('nome-estudante').textContent = estudante;
    document.getElementById('turma-estudante').textContent = dados.turma;
    document.getElementById('caixa-texto').innerHTML = dados.html;
    document.getElementById('etiq-nome').textContent = estudante;
    document.getElementById('etiq-turma').textContent = dados.turma;
    
    document.getElementById('painel').style.display = "flex";
    mudarAba('relatorio');
}

document.getElementById('caixa-texto').addEventListener('input', (e) => {
    let estudante = document.getElementById('nome-estudante').textContent;
    if(estudante && estudante !== "Aguardando arquivo...") {
        let db = {};
        try { db = JSON.parse(localStorage.getItem('eema_banco')) || {}; } catch(err) {}
        if(db[estudante]) {
            db[estudante].html = e.target.innerHTML;
            localStorage.setItem('eema_banco', JSON.stringify(db));
        }
    }
});

function processarArquivo(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const workbook = XLSX.read(new Uint8Array(e.target.result), {type: 'array'});
            const linhasJson = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            
            let nomeArquivo = file.name.replace('.xlsx', '').replace('.csv', '');
            let partes = nomeArquivo.split('-'); 
            let estudante = partes[0] ? partes[0].trim() : "Estudante Não Identificado";
            let turma = partes[1] ? partes[1].replace('(respostas)', '').trim() : "Turma Não Identificada";

            let htmlGerado = gerarHTMLDinamico(estudante, turma, linhasJson);
            
            let db = {};
            try { db = JSON.parse(localStorage.getItem('eema_banco')) || {}; } catch(err) {}
            db[estudante] = { turma: turma, html: htmlGerado };
            localStorage.setItem('eema_banco', JSON.stringify(db));
            
            carregarSelectHistorico();
            document.getElementById('select-historico').value = estudante;
            abrirAluno(estudante);
            
            dropZone.innerHTML = "✅ Processado e Salvo! Arraste outro para continuar.";
            dropZone.style.backgroundColor = "#e6fffa"; dropZone.style.color = "#047857";
        } catch(error) {
            console.error(error);
            dropZone.innerHTML = "❌ Ocorreu um erro ao processar. Atualize a página.";
            dropZone.style.backgroundColor = "#fee2e2"; dropZone.style.color = "#b91c1c";
        }
    };
    reader.readAsArrayBuffer(file);
}

const conAbertura = ["Segundo os apontamentos da Docente X,", "Conforme as observações registradas pela Docente X,", "De acordo com a avaliação da Docente X,", "Na perspectiva da Docente X,", "Pelos registros pedagógicos da Docente X,"];
const conElocucaoNormal = ["a educadora relata que", "a professora menciona que", "a docente destaca que", "a educadora enfatiza que", "a professora pontua que"];
const conElocucaoAdicional = ["A docente acrescenta ainda que", "A educadora também ressalta que", "Ela ainda relata que", "A professora complementa dizendo que", "Acrescenta ainda que"];
const conSoma = ["Além disso,", "Outrossim,", "Ademais,", "Como também,", "Em adição,"];
const conContraste = ["Todavia,", "Contudo,", "Entretanto,", "No entanto,", "Apesar disso,"];

function sortear(lista, historico) {
    let disp = lista.filter(c => !historico.includes(c));
    if (disp.length === 0) disp = lista;
    let s = disp[Math.floor(Math.random() * disp.length)];
    historico.push(s); return s;
}

function analisar(texto) {
    let t = String(texto).trim().replace(/\s+/g, ' ').replace(/\s+,/g, ',').replace(/\s+\./g, '.').replace(/[.!?]+$/, ''); 
    t = t.replace(/\bas vezes\b/gi, 'às vezes').replace(/\bcomportar-se\b/gi, 'comporta-se');
    if(t.length > 0 && t.charAt(0) !== t.charAt(0).toLowerCase()) t = t.charAt(0).toLowerCase() + t.slice(1);
    let comp = t.toLowerCase().replace(/[^a-záéíóúãõç\s]/g, '').trim();
    return {
        txt: t,
        isVazio: ["nao ha", "nada a declarar", "nada", "nenhuma"].includes(comp) || comp === "",
        isSim: ["sim", "sempre", "com certeza"].includes(comp),
        isNao: ["nao", "não", "nunca"].includes(comp),
        isAsVezes: ["as vezes", "às vezes", "quase sempre", "parcialmente"].includes(comp)
    };
}

function gerarHTMLDinamico(estudante, turma, linhas) {
    let texto = `<p style="text-indent: 30px; text-align: justify; line-height: 1.6;">O presente relatório consolida a observação analítica do corpo docente acerca do desenvolvimento escolar e sociocomportamental do(a) estudante <strong>${estudante}</strong>, regularmente matriculado(a) na turma ${turma}. O escopo deste documento visa registrar, de forma criteriosa e transparente, as informações pedagógicas coletadas no período, resguardando a identidade dos profissionais avaliadores mediante numeração sequencial.</p>`;

    let contador = 1; let aberturas = []; 

    linhas.forEach(linha => {
        let perguntas = Object.keys(linha).filter(c => !c.toLowerCase().includes('data/hora') && !c.toLowerCase().includes('professor'));
        if (perguntas.length === 0) return;

        let trechos = []; let hCon = []; let hEloc = [];
        let flFreq = false; let flAtiv = false; let flGrup = false;

        perguntas.forEach((p) => {
            let an = analisar(linha[p]); let pMin = p.toLowerCase();
            if (an.isVazio) return;
            let parte = "";
            
            if (pMin.includes("frequente") || pMin.includes("frequência")) {
                if(flFreq) return;
                if (an.isSim) parte = "o estudante mantém assiduidade regular nas aulas";
                else if (an.isNao) parte = "o estudante registra um índice preocupante de infrequência";
                else if (an.isAsVezes) parte = "o estudante apresenta uma frequência irregular e oscilante";
                else parte = `em relação à assiduidade, ${an.txt}`;
                flFreq = true;
            }
            else if (pMin.includes("atividades") && !pMin.includes("grupo")) {
                if(flAtiv) return;
                if (an.isSim) parte = "cumpre com todas as atividades propostas";
                else if (an.isNao) parte = "apresenta resistência e não executa as tarefas solicitadas";
                else if (an.isAsVezes) parte = "realiza as atividades propostas apenas ocasionalmente";
                else parte = `quanto às tarefas, ${an.txt}`;
                flAtiv = true;
            }
            else if (pMin.includes("convivência") || pMin.includes("grupo") || pMin.includes("colegas") || pMin.includes("participa")) {
                if(flGrup) return;
                if (an.isSim) parte = "sobre a socialização e participação, participa ativamente das aulas e apresenta excelente convívio social";
                else if (an.isNao) parte = "sobre a socialização e participação, demonstra resistência nas interações e trabalhos em grupo";
                else if (an.isAsVezes) parte = "sobre a socialização e participação, envolve-se nas dinâmicas coletivas de forma pontual e restrita";
                else parte = `sobre a socialização e participação, ${an.txt}`;
                flGrup = true;
            }
            else if (pMin.includes("desempenho") || pMin.includes("aprendizado") || pMin.includes("comportamento")) {
                parte = `[QUEBRA] o estudante ${an.txt}`;
            }
            else if (pMin.includes("chame a atenção") || pMin.includes("fato") || pMin.includes("relate")) {
                if (an.isSim || an.isNao || an.isAsVezes) return; 
                parte = `[RESSALVA] ${an.txt}`; 
            }
            else { parte = `complementa que ${an.txt}`; }
            if(parte !== "") trechos.push(parte);
        });

        if (trechos.length > 0) {
            let paragrafo = `${sortear(conAbertura, aberturas).replace('X', contador)} ${trechos[0]}`; 
            for (let i = 1; i < trechos.length; i++) {
                let t = trechos[i];
                if (t.includes("[RESSALVA]")) {
                    paragrafo += `. ${(i % 2 === 0) ? "A docente ressalta que" : "Além disso, a educadora ressalta que"} ${t.replace("[RESSALVA]", "").trim()}`;
                } else if (t.includes("[QUEBRA]")) {
                    paragrafo += `. ${sortear(conElocucaoAdicional, hEloc)} ${t.replace("[QUEBRA]", "").trim()}`;
                } else {
                    let neg = t.toLowerCase().match(/(resistência|infrequência|irregular|dificuldade|pouco|desinteresse|não executa|ocasionalmente|negativo)/);
                    paragrafo += `. ${neg ? sortear(conContraste, hCon) : sortear(conSoma, hCon)} ${sortear(conElocucaoNormal, hEloc)} ${t}`;
                }
            }
            texto += `<p style="text-indent: 30px; text-align: justify; line-height: 1.6;">${paragrafo.replace(/\s+/g, ' ').replace(/\.\./g, '.').trim()}.</p>`;
            contador++;
        }
    });

    texto += `<p style="text-indent: 30px; text-align: justify; line-height: 1.6;">Com a intenção de garantir a evolução do discente, a equipe pedagógica reitera que sempre está motivando e orientando o estudante em relação às suas necessidades pedagógicas. No mais, colocamo-nos à inteira disposição da família e demais interessados para eventuais esclarecimentos e alinhamentos de estratégias conjuntas.</p>`;
    return texto;
}
