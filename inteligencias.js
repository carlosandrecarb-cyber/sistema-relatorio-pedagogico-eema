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
        let trechos = []; 

        perguntas.forEach((pergunta) => {
            let resposta = linha[pergunta] ? String(linha[pergunta]).trim() : "";
            let pergMin = pergunta.toLowerCase();

            // Ignora se estiver vazio, se for um traço ou respostas que indicam que não há nada a relatar
            if (!resposta || resposta === "-" || resposta.toLowerCase().includes("nada a declarar") || resposta.toLowerCase() === "não há" || resposta.toLowerCase() === "nada") return;

            // Remove pontuação final e espaços soltos para encaixar na frase
            resposta = resposta.replace(/[.!?]$/, '').trim();
            
            // ==============================================================
            // O NOVO DETECTOR DE RESPOSTAS CURTAS
            // Limpa a palavra de qualquer ponto oculto só para identificá-la
            // ==============================================================
            let testeCurto = resposta.toLowerCase().replace(/[^a-záéíóúãõç\s]/g, '').trim();
            let isSim = (testeCurto === "sim" || testeCurto === "sempre" || testeCurto === "com certeza");
            let isNao = (testeCurto === "nao" || testeCurto === "não" || testeCurto === "nunca");
            let isAsVezes = (testeCurto === "as vezes" || testeCurto === "às vezes" || testeCurto === "quase sempre" || testeCurto === "raramente" || testeCurto === "parcialmente");

            let parteConstruida = "";

            // Lógica 1: Frequência
            if (pergMin.includes("frequente") || pergMin.includes("frequência")) {
                if (isSim) parteConstruida = "o estudante mantém assiduidade regular nas aulas";
                else if (isNao) parteConstruida = "registra-se um índice preocupante de infrequência";
                else if (isAsVezes) parteConstruida = "apresenta uma frequência irregular";
                else parteConstruida = `em relação à assiduidade, ${resposta.charAt(0).toLowerCase() + resposta.slice(1)}`;
            }
            
            // Lógica 2: Cumprimento de Atividades
            else if (pergMin.includes("atividades") && !pergMin.includes("grupo")) {
                if (isSim) parteConstruida = "cumpre com todas as atividades propostas";
                else if (isNao) parteConstruida = "apresenta resistência e não executa as atividades propostas";
                else if (isAsVezes) parteConstruida = "realiza as atividades solicitadas apenas ocasionalmente";
                else parteConstruida = `quanto às tarefas, observa-se que ${resposta.charAt(0).toLowerCase() + resposta.slice(1)}`;
            }

            // Lógica 3: Participação / Grupo
            else if (pergMin.includes("participa") || pergMin.includes("grupo")) {
                if (isSim) parteConstruida = "participa ativamente das aulas e dos trabalhos coletivos";
                else if (isNao) parteConstruida = "demonstra resistência e não se envolve nas dinâmicas de grupo";
                else if (isAsVezes) parteConstruida = "envolve-se nas atividades conjuntas de forma parcial e pontual";
                else parteConstruida = `sobre a participação, nota-se que ${resposta.charAt(0).toLowerCase() + resposta.slice(1)}`;
            }

            // Lógica 4: Observações Extras
            else if (pergMin.includes("chame a atenção") || pergMin.includes("fato") || pergMin.includes("observação")) {
                if (isSim || isNao || isAsVezes) return; // Se for observação extra e o professor disser só "sim", ignoramos porque não acrescenta nada
                parteConstruida = `vale ressaltar que ${resposta.charAt(0).toLowerCase() + resposta.slice(1)}`;
            }
            
            // Lógica 5: Outras perguntas genéricas que o formulário vier a ter
            else {
                if (isSim) parteConstruida = `houve um retorno afirmativo da docente em relação a este quesito`;
                else if (isNao) parteConstruida = `houve um retorno negativo da docente em relação a este quesito`;
                else if (isAsVezes) parteConstruida = `observou-se que a ocorrência se dá de forma parcial ou ocasional`;
                else parteConstruida = `pontuou-se também que ${resposta.charAt(0).toLowerCase() + resposta.slice(1)}`;
            }

            if(parteConstruida) trechos.push(parteConstruida);
        });

        // ==============================================================
        // ESTRUTURADOR SINTÁTICO DOS PARÁGRAFOS
        // ==============================================================
        if (trechos.length > 0) {
            for (let i = 0; i < trechos.length; i++) {
                if (i === 0) {
                    // Começo da frase
                    paragrafo += trechos[i];
                } else if (i === trechos.length - 1) {
                    // Final da frase (com conectivos de encerramento)
                    if (trechos[i].includes("vale ressaltar")) {
                        paragrafo += `. ${trechos[i].charAt(0).toUpperCase() + trechos[i].slice(1)}`;
                    } else {
                        paragrafo += `, e, por fim, ${trechos[i]}`;
                    }
                } else {
                    // Meio da frase (com conectivos de continuidade)
                    paragrafo += `. Ademais, ${trechos[i]}`;
                }
            }
            paragrafo += `.`; // Ponto final do parágrafo daquele professor
            texto += `<p style="text-indent: 30px;">${paragrafo}</p>`;
            contadorDocentes++;
        }
    });

    texto += `<p style="text-indent: 30px;">Diante do quadro consolidado, a equipe pedagógica reitera a importância do acompanhamento constante. Colocamo-nos à inteira disposição da família e demais interessados para eventuais esclarecimentos e alinhamentos de estratégias conjuntas.</p>`;

    caixaTexto.innerHTML = texto;
}
