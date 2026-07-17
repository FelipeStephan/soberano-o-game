// O GABINETE — elenco FIXO e curado (decisão de design).
// Papéis e personalidades são fixos: continuidade = apego = drama, e a IA nunca
// "esquece" quem é seu Secretário de Defesa. A IA dá VOZ a eles, não os inventa.
//
// O campo `personagem` da Carta referencia estes ids.

export const ELENCO_EUA_2026 = [
  {
    id: 'sec_defesa',
    papel: 'Secretário de Defesa',
    nome: 'General Marcus Hale',
    personalidade: 'Falcão. Vê ameaça em tudo, quer projeção de força. Lema: "Fraqueza convida invasão."',
  },
  {
    id: 'dir_cia',
    papel: 'Diretora da CIA',
    nome: 'Diane Okoro',
    personalidade: 'Fria, calculista, adora soluções nos bastidores. Prefere o bisturi da espionagem à marreta da guerra.',
  },
  {
    id: 'sec_tesouro',
    papel: 'Secretário do Tesouro',
    nome: 'Arthur Feld',
    personalidade: 'Cauteloso, obcecado por mercados e disciplina fiscal. Enxerga toda decisão como uma linha numa planilha.',
  },
  {
    id: 'sec_estado',
    papel: 'Secretária de Estado',
    nome: 'Elena Vásquez',
    personalidade: 'Diplomata paciente. Prioriza alianças e a narrativa internacional. "Toda porta que fechamos é uma que não reabre."',
  },
  {
    id: 'chefe_gabinete',
    papel: 'Chefe de Gabinete',
    nome: 'Ray Sullivan',
    personalidade: 'Operador político. Só pensa em aprovação, eleições e no humor das ruas. Traz as más notícias internas.',
  },
];
