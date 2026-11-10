const dadosDoAluno = {
    nome: "Carlos Henrique Mota Leite",
    docentes: [
        { id: 1, frequente: true,  convivio: "convive bem com todos", desempenho: "apresentou melhora na leitura e comporta-se muito bem, mas ainda é muito lento para copiar as atividades e dificilmente realiza as tarefas de casa" },
        { id: 2, frequente: true,  convivio: "interage bem", desempenho: "é muito disperso, desinteressado, desmotivado e conversa bastante. Apresenta muita dificuldade de aprendizagem e não consegue concentrar nas atividades" },
        { id: 3, frequente: true,  convivio: "tem uma boa convivência e respeita os colegas", desempenho: "apresenta dificuldade e lentidão para copiar as atividades. Contudo, apresentou uma melhora comparando ao ano anterior" },
        { id: 4, frequente: true, convivio: "interage pouco com os colegas e mexe muito com eles", desempenho: "apresenta extrema dificuldade de aprendizado, sendo extremamente desinteressado" }
    ]
};

function gerarTextoInteligente() {
    const caixaTexto = document.getElementById('caixa-texto');
    
    let texto = `<p>O presente relatório descreve o desenvolvimento e a aprendizagem do estudante ${dadosDoAluno.nome}, atualmente matriculado e frequente no 6º ANO DO ENSINO FUNDAMENTAL - Turma 6º REG 2. O objetivo deste documento é consolidar a visão do corpo docente sobre o desempenho, a interação e a atenção do estudante, fornecendo um panorama abrangente de sua vivência no ambiente escolar. Para preservar a identidade dos profissionais, as observações foram anonimizadas e identificadas numericamente (ex.: Docente 1, Docente 2).</p>`;

    dadosDoAluno.docentes.forEach(docente => {
        let paragrafo = `De acordo com as observações da Docente ${docente.id}, `;
        
        if(docente.frequente) {
            paragrafo += "o estudante mantém assiduidade regular nas aulas. ";
        } else {
            paragrafo += "o estudante apresenta faltas constantes. ";
        }

        paragrafo += `Em relação à convivência, nota-se que ${docente.convivio}. `;

        const perf = docente.desempenho.toLowerCase();
        
        if (perf.includes("mas") || perf.includes("contudo") || perf.includes("porém")) {
            paragrafo += `Quanto ao desempenho acadêmico, a docente relata que o aluno ${docente.desempenho}.`;
        } 
        else if (perf.includes("dificuldade") || perf.includes("disperso")) {
            paragrafo += `Por outro lado, no aspecto pedagógico, o aluno ${docente.desempenho}.`;
        } 
        else {
            paragrafo += `Ademais, no aspecto acadêmico, destaca-se que o aluno ${docente.desempenho}.`;
        }

        texto += `<p>${paragrafo}</p>`;
    });

    texto += `<p>Ademais, colocamo-nos à disposição para maiores esclarecimentos e complementações pontuais caso sejam necessárias.</p>`;

    caixaTexto.innerHTML = texto;
}

document.addEventListener('DOMContentLoaded', () => {
    const dataElement = document.getElementById('data-atual');
    if(dataElement) {
        const hoje = new Date();
        const opcoes = { day: '2-digit', month: 'long', year: 'numeric' };
        dataElement.textContent = `Carbonita - MG, ${hoje.toLocaleDateString('pt-BR', opcoes)}.`;
    }
});
