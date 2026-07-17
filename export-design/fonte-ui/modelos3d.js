// ═══════════════════════════════════════════════════════════════════════
// MODELOS 3D — construídos na mão, sem asset externo, sem loader
// ═══════════════════════════════════════════════════════════════════════
// POR QUE A PRIMEIRA VERSÃO PARECIA CHAPADA:
// Todos os modelos usavam MeshBasicMaterial — um material que IGNORA luz. Não importa
// quantos polígonos você empilhe: sem sombreamento, tudo vira uma silhueta de cor
// única. O satélite parecia 3D por acidente (tinha cores diferentes por peça).
//
// A CORREÇÃO: MeshPhongMaterial + flatShading. Cada face pega a luz num ângulo
// diferente e o volume aparece sozinho. `flatShading` mantém o visual facetado
// low-poly (em vez de plástico liso), que é exatamente a estética do jogo.
//
// E como a cena da globe.gl tem iluminação própria mas fraca pro nosso gosto,
// `luzes()` devolve um rig de 3 pontos pra pendurar no grupo das órbitas.
import * as THREE from 'three';

// Material padrão: facetado, com brilho especular discreto.
const mat = (cor, opts = {}) => new THREE.MeshPhongMaterial({
  color: cor, flatShading: true, shininess: 28, specular: 0x223344, ...opts,
});
// Material sem luz (só pra coisas que EMITEM: chama, luz de navegação, traçante).
const emissivo = (cor, opts = {}) => new THREE.MeshBasicMaterial({ color: cor, ...opts });

// Rig de iluminação de 3 pontos — sem isso o Phong fica preto.
export function luzes() {
  const g = new THREE.Group();
  g.add(new THREE.AmbientLight(0x93b4d8, 1.1));            // preenchimento frio
  const chave = new THREE.DirectionalLight(0xffffff, 1.5);  // luz principal
  chave.position.set(1, 1, 1);
  g.add(chave);
  const contra = new THREE.DirectionalLight(0x35e0ff, 0.7); // contraluz ciano do jogo
  contra.position.set(-1, -0.5, -1);
  g.add(contra);
  return g;
}

// ═══ CAÇA (furtivo, tipo F-35/J-20) ═══════════════════════════════════
// Fuselagem em três seções (nariz cônico, corpo, cauda), asa em delta com enflechamento,
// canopy translúcida, dois estabilizadores inclinados (a assinatura visual do furtivo),
// entradas de ar e pós-combustão que pulsa.
export function caca(cor = 0xdfe8ff, escala = 1) {
  const g = new THREE.Group();
  const escuro = new THREE.Color(cor).multiplyScalar(0.62).getHex();

  // fuselagem: corpo principal achatado (caça furtivo é chato, não cilíndrico)
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.62, 4.6, 6), mat(cor));
  corpo.rotation.x = Math.PI / 2;
  corpo.scale.set(1, 1, 0.55);   // achata na vertical
  g.add(corpo);

  // nariz cônico
  const nariz = new THREE.Mesh(new THREE.ConeGeometry(0.75, 2.4, 6), mat(cor));
  nariz.rotation.x = Math.PI / 2;
  nariz.position.z = 3.5;
  nariz.scale.set(1, 1, 0.55);
  g.add(nariz);

  // canopy (cabine) — translúcida, é o detalhe que faz o olho ler "avião"
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7fd4ff, { transparent: true, opacity: 0.75, shininess: 90 }));
  canopy.position.set(0, 0.34, 1.7);
  canopy.scale.set(0.85, 0.8, 2.1);
  g.add(canopy);

  // asa em delta com enflechamento (leading edge inclinada pra trás)
  const asaG = new THREE.BufferGeometry();
  asaG.setAttribute('position', new THREE.Float32BufferAttribute([
    // esquerda: raiz frente → ponta → raiz trás
    0, 0, 1.6, -4.0, 0, -1.4, 0, 0, -2.2,
    // direita
    0, 0, 1.6, 4.0, 0, -1.4, 0, 0, -2.2,
  ], 3));
  asaG.computeVertexNormals();
  const asas = new THREE.Mesh(asaG, mat(cor, { side: THREE.DoubleSide }));
  g.add(asas);

  // estabilizadores em V (inclinados — assinatura do furtivo)
  for (const lado of [-1, 1]) {
    const estG = new THREE.BufferGeometry();
    estG.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, -1.6, lado * 1.1, 1.3, -2.6, 0, 0, -2.8,
    ], 3));
    estG.computeVertexNormals();
    const est = new THREE.Mesh(estG, mat(escuro, { side: THREE.DoubleSide }));
    est.position.x = lado * 0.5;
    g.add(est);
  }

  // entradas de ar
  for (const lado of [-1, 1]) {
    const ar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 1.5), mat(escuro));
    ar.position.set(lado * 0.72, -0.1, 0.9);
    g.add(ar);
  }

  // bocal do motor
  const bocal = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.55, 0.7, 8), mat(0x40485a));
  bocal.rotation.x = Math.PI / 2;
  bocal.position.z = -2.4;
  g.add(bocal);

  // pós-combustão (emissiva — pulsa no loop de animação, ver globo.js)
  const fogo = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.4, 8), emissivo(0x59e6ff, { transparent: true, opacity: 0.8 }));
  fogo.rotation.x = -Math.PI / 2;
  fogo.position.z = -3.7;
  fogo.name = 'chama';
  g.add(fogo);

  g.scale.setScalar(escala);
  return g;
}

// ═══ NAVIO DE GUERRA (destróier, tipo Arleigh Burke) ══════════════════
// Casco com proa em cunha e tumblehome, superestrutura em três níveis,
// mastro de radar, chaminé, VLS, canhão de proa e heliponto.
export function navio(cor = 0xb8c6de, escala = 1) {
  const g = new THREE.Group();
  const escuro = new THREE.Color(cor).multiplyScalar(0.7).getHex();
  const conves = new THREE.Color(cor).multiplyScalar(0.5).getHex();

  // casco: mais estreito embaixo (é assim que navio de guerra é)
  const casco = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.15, 8.4), mat(cor));
  casco.geometry.translate(0, 0, 0);
  g.add(casco);
  const fundo = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 7.6), mat(escuro));
  fundo.position.y = -0.75;
  g.add(fundo);

  // proa em cunha
  const proa = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.8, 4), mat(cor));
  proa.rotation.x = Math.PI / 2;
  proa.rotation.z = Math.PI / 4;
  proa.position.z = 5.4;
  proa.scale.y = 0.55;
  g.add(proa);

  // convés
  const cv = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.12, 8.5), mat(conves));
  cv.position.y = 0.62;
  g.add(cv);

  // superestrutura escalonada (3 níveis) — é o que dá silhueta de navio de guerra
  const n1 = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.9, 3.2), mat(cor));
  n1.position.set(0, 1.1, 0.6); g.add(n1);
  const n2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 2.0), mat(cor));
  n2.position.set(0, 1.9, 1.0); g.add(n2);
  const ponte = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.2), mat(0x7fd4ff, { transparent: true, opacity: 0.8, shininess: 80 }));
  ponte.position.set(0, 2.5, 1.4); g.add(ponte);

  // mastro de radar
  const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 2.6, 6), mat(escuro));
  mastro.position.set(0, 3.9, 1.0); g.add(mastro);
  const radar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.1), emissivo(0x35e0ff, { transparent: true, opacity: 0.85 }));
  radar.position.set(0, 4.4, 1.0);
  radar.name = 'radar';   // gira no loop
  g.add(radar);

  // chaminé
  const chamine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.9), mat(escuro));
  chamine.position.set(0, 1.9, -0.8); g.add(chamine);

  // lançadores verticais (VLS) — as duas grades de células
  for (const z of [3.0, -2.6]) {
    const vls = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 1.1), mat(0x4a5568));
    vls.position.set(0, 0.72, z); g.add(vls);
  }

  // canhão de proa
  const torreta = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.45, 8), mat(cor));
  torreta.position.set(0, 0.9, 4.0); g.add(torreta);
  const canhao = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 6), mat(0x6f819c));
  canhao.rotation.x = Math.PI / 2;
  canhao.position.set(0, 1.0, 4.8); g.add(canhao);

  // heliponto na popa
  const heli = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 1.8), mat(0x39424f));
  heli.position.set(0, 0.7, -3.4); g.add(heli);

  g.scale.setScalar(escala);
  return g;
}

// ═══ SUBMARINO (SSN, tipo Virginia) ═══════════════════════════════════
// Casco em cápsula com afunilamento na popa, vela com planos de mergulho,
// leme cruciforme e hélice. Luz de casco pra ler no escuro do oceano.
export function submarino(cor = 0x5a6a80, escala = 1) {
  const g = new THREE.Group();
  const escuro = new THREE.Color(cor).multiplyScalar(0.65).getHex();

  // casco principal
  const casco = new THREE.Mesh(new THREE.CapsuleGeometry(0.85, 5.6, 6, 12), mat(cor));
  casco.rotation.x = Math.PI / 2;
  g.add(casco);

  // afunilamento da popa (submarino moderno é uma gota)
  const popa = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.8, 10), mat(cor));
  popa.rotation.x = -Math.PI / 2;
  popa.position.z = -3.9;
  g.add(popa);

  // vela (torre de comando)
  const vela = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.5, 2.0), mat(escuro));
  vela.position.set(0, 1.0, 0.8);
  g.add(vela);
  // topo arredondado da vela
  const velaTopo = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.0, 6), mat(escuro));
  velaTopo.rotation.x = Math.PI / 2;
  velaTopo.position.set(0, 1.72, 0.8);
  g.add(velaTopo);
  // periscópio
  const peri = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 4), mat(0x2a3140));
  peri.position.set(0, 2.3, 0.5);
  g.add(peri);

  // planos de mergulho na vela
  const planos = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 0.55), mat(escuro));
  planos.position.set(0, 1.15, 0.8);
  g.add(planos);

  // leme cruciforme na popa (vertical + horizontal)
  const lemeV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.9, 1.0), mat(escuro));
  lemeV.position.set(0, 0, -3.6); g.add(lemeV);
  const lemeH = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.0), mat(escuro));
  lemeH.position.set(0, 0, -3.6); g.add(lemeH);

  // hélice
  const helice = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.6, 7), mat(0x8a7a55));
  helice.rotation.x = -Math.PI / 2;
  helice.position.z = -4.7;
  helice.name = 'helice';   // gira no loop
  g.add(helice);

  // luz de casco — sem isto o submarino some no azul do oceano
  const luz = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), emissivo(0x35e0ff));
  luz.position.set(0, 1.9, 1.4);
  g.add(luz);

  g.scale.setScalar(escala);
  return g;
}

// ═══ PORTA-AVIÕES (classe Ford) ═══════════════════════════════════════
// Convés angulado (a invenção britânica que permitiu jato em porta-aviões),
// ilha deslocada a estibordo, catapultas, elevador e caças estacionados.
export function portaAvioes(cor = 0x9fb0c8, escala = 1) {
  const g = new THREE.Group();
  const escuro = new THREE.Color(cor).multiplyScalar(0.68).getHex();

  // casco
  const casco = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.4, 12), mat(cor));
  g.add(casco);
  const proa = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.4, 4), mat(cor));
  proa.rotation.x = Math.PI / 2; proa.rotation.z = Math.PI / 4;
  proa.position.z = 6.8; proa.scale.y = 0.42;
  g.add(proa);

  // convés de voo (mais largo que o casco — é a característica visual)
  const conves = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.22, 13.4), mat(0x4e5867));
  conves.position.y = 0.8;
  g.add(conves);

  // convés angulado a bombordo (o pedaço torto onde os aviões pousam)
  const angulado = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 7.0), mat(0x454e5c));
  angulado.position.set(-1.6, 0.82, 1.4);
  angulado.rotation.y = 0.16;   // ~9°, como no real
  g.add(angulado);

  // faixas das catapultas
  for (const x of [-0.6, 0.9]) {
    const cat = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 6.4), emissivo(0xdfe8ff, { transparent: true, opacity: 0.45 }));
    cat.position.set(x, 0.93, 3.0);
    g.add(cat);
  }

  // ilha (superestrutura) — deslocada a estibordo
  const ilha = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.6, 2.4), mat(cor));
  ilha.position.set(2.0, 1.7, -1.4); g.add(ilha);
  const ponte = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 1.4), mat(0x7fd4ff, { transparent: true, opacity: 0.8 }));
  ponte.position.set(2.0, 2.2, -1.0); g.add(ponte);
  const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.8, 6), mat(escuro));
  mastro.position.set(2.0, 3.4, -1.4); g.add(mastro);
  const radar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.08), emissivo(0x35e0ff, { transparent: true, opacity: 0.8 }));
  radar.position.set(2.0, 3.9, -1.4);
  radar.name = 'radar';
  g.add(radar);

  // caças estacionados no convés
  const posicoes = [[-1.7, 4.6, 0.5], [-1.0, 2.4, 0.2], [1.2, -3.4, -0.4], [1.9, -4.8, -0.7]];
  for (const [x, z, rot] of posicoes) {
    const a = caca(0xcfdcf0, 0.2);
    a.position.set(x, 0.98, z);
    a.rotation.y = rot;
    g.add(a);
  }

  g.scale.setScalar(escala);
  return g;
}

// ═══ SATÉLITE ═════════════════════════════════════════════════════════
// O usuário elogiou este — mantive a silhueta e só ganhei sombreamento,
// painéis com célula visível e antena parabólica de verdade.
export function satelite(escala = 1) {
  const g = new THREE.Group();

  // corpo
  g.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 2.4), mat(0xdfe8ff)));
  // detalhe térmico dourado (a manta que todo satélite tem)
  const manta = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.5, 2.45), mat(0xd4a843));
  g.add(manta);

  // painéis solares em dois segmentos por lado
  for (const lado of [-1, 1]) {
    for (let i = 0; i < 2; i += 1) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.6), mat(0x1e5fa8, { shininess: 90 }));
      p.position.set(lado * (1.1 + i * 1.6), 0, 0);
      g.add(p);
      // haste
      const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 4), mat(0x8899aa));
      haste.rotation.z = Math.PI / 2;
      haste.position.set(lado * (0.5 + i * 1.6), 0, 0);
      g.add(haste);
    }
  }

  // antena parabólica
  const prato = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), mat(0xeef4ff, { side: THREE.DoubleSide }));
  prato.rotation.x = Math.PI;
  prato.position.y = -0.95;
  g.add(prato);
  const alim = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 4), mat(0x8899aa));
  alim.position.y = -1.35;
  g.add(alim);

  // luz de status piscante
  const luz = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), emissivo(0xff3b5c));
  luz.position.set(0, 0.75, 1.2);
  luz.name = 'pisca';
  g.add(luz);

  g.scale.setScalar(escala);
  return g;
}

// ═══ MÍSSIL ═══════════════════════════════════════════════════════════
// Antes era uma esfera. Agora é um míssil: corpo, ogiva, aletas e escape.
export function missil(escala = 1) {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.6, 7), mat(0xe8eef8));
  corpo.rotation.x = Math.PI / 2;
  g.add(corpo);
  const ogiva = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 7), mat(0xff6b4a));
  ogiva.rotation.x = Math.PI / 2;
  ogiva.position.z = 1.05;
  g.add(ogiva);
  for (const ang of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const aleta = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.4), mat(0xb9c4d4));
    aleta.position.set(Math.cos(ang) * 0.3, Math.sin(ang) * 0.3, -0.65);
    aleta.rotation.z = ang;
    g.add(aleta);
  }
  const escape = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.9, 6), emissivo(0xffb020, { transparent: true, opacity: 0.9 }));
  escape.rotation.x = -Math.PI / 2;
  escape.position.z = -1.25;
  escape.name = 'chama';
  g.add(escape);
  g.scale.setScalar(escala);
  return g;
}

export const MODELOS = { caca, navio, submarino, portaAvioes, satelite, missil };
