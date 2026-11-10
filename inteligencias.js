/* =========================================================================
   MOTOR DE TEXTO: Lógica para conectar frases respeitando normas gramaticais
   ========================================================================= */

// Simulação dos dados que virão do seu Forms/Planilha para o Carlos Henrique
const dadosDoAluno = {
    nome: "Carlos Henrique Mota Leite",
    docentes: [
        { id: 1, frequente: true,  convivio: "ótima convivência com todos", desempenho: "melhora na leitura e comportamento, porém lentidão em copiar atividades e não faz o dever" },
        { id: 2, frequente: true,  convivio: "interage bem", desempenho: "extrema dispersão e desmotivação, não consegue manter foco, muito distraído" },
        { id: 3, frequente: true,  convivio: "respeitador", desempenho: "dificuldade de aprendizagem e lentidão extrema, mas apresentou evolução se comparado ao ano anterior" },
        { id: 4, frequente: false, convivio: "mexe muito com os colegas", desempenho: "extrema dificuldade e desinteresse profundo" }
    ]
};

// Função para iniciar a construção do texto (chamada pelo botão)
function gerarTextoInteligente() {
    const caixaTexto = document.getElementById('caixa-texto');
    
    // Zera o conteúdo atual para escrever o novo
    caixaTexto.innerHTML = '';
    
    // 1. Parágrafo Introdutório (Apresentação formal)
    let texto = `<p>O presente relatório consolida a observação analítica do corpo docente acerca do desenvolvimento escolar e sociocomportamental do estudante ${dadosDoAluno.nome}. O escopo deste documento visa registrar de forma criteriosa as potencialidades, bem como os desafios de aprendizagem demonstrados no período, resguardando a identidade dos professores mediante numeração sequencial.</p>`;

    // 2. Loop Inteligente pelos Docentes (Construção Gramatical)
    dadosDoAluno.docentes.forEach(docente => {
        let paragrafo = `Segundo as observações da Docente ${docente.id}, `;
        
        // Avalia Frequência
        if(docente.frequente) {
            paragrafo += "o estudante mantém assiduidade regular nas aulas. ";
        } else {
            paragrafo += "registram-se faltas frequentes, o que compromete o ritmo pedagógico. ";
        }

        // Avalia Convivência (Uso de conectivos)
        paragrafo += `No tocante à socialização, nota-se que ${docente.convivio}. `;

        // Avalia Desempenho e procura contrastes (Positivo vs Negativo)
        const perf = docente.desempenho.toLowerCase();
        
        if (perf.includes("porém") || perf.includes("mas") || perf.includes("entretanto")) {
            // Se já tem contraste natural na fala, o sistema adapta
            paragrafo += `Em relação à aprendizagem, relata-se ${docente.desempenho}.`;
        } 
        else if (perf.includes("dificuldade") || perf.includes("disperso") || perf.includes("desinteresse")) {
            // Se é um relato preocupante, usamos "Todavia" ou "Por outro lado" dependendo da socialização
            paragrafo += `Por outro lado, no eixo acadêmico, o aluno apresenta ${docente.desempenho}.`;
        } 
        else {
            // Se for totalmente positivo
            paragrafo += `Ademais, no aspecto cognitivo, destaca-se sua ${docente.desempenho}.`;
        }

        texto += `<p>${paragrafo}</p>`;
    });

    // 3. Parágrafo Conclusivo (Padrão Supervisão)
    texto += `<p>Diante do quadro exposto, a equipe pedagógica reitera a necessidade de um acompanhamento contínuo. Colocamo-nos à inteira disposição para eventuais esclarecimentos e alinhamentos de estratégias intervencionistas conjuntas.</p>`;

    // Injeta o HTML pronto e formatado na caixa editável
    caixaTexto.innerHTML = texto;
}

// Pequeno script para manter a data atualizada sempre que gerar um novo
document.addEventListener('DOMContentLoaded', () => {
    const dataElement = document.getElementById('data-atual');
    const hoje = new Date();
    const opcoes = { day: '2-digit', month: 'long', year: 'numeric' };
    dataElement.textContent = `Carbonita - MG, ${hoje.toLocaleDateString('pt-BR', opcoes)}.`;
});