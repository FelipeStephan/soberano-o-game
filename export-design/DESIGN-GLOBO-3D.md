# SOBERANO — Globo 3D: objetos, animações e efeitos

> Parte 2 do design system. Aqui vive o que o `estilo.css` **não** consegue contar:
> os modelos three.js feitos à mão, as camadas do globe.gl e as animações.
> Stack: `globe.gl` + `three.js` + `CSS2DRenderer`.
> Arquivos: `ui/globo.js`, `ui/modelos3d.js`, `ui/tatico.js`, `ui/efeitos.js`.

---

## 1. As 10 regras que não podem ser quebradas

Aprendidas na marra. Se você recriar isto em outra ferramenta, comece por elas:

1. **`Globe({ extraRenderers: [new CSS2DRenderer()] })`** — sem isso `htmlElementsData` não existe.
2. **Adicione o rig de luz à cena** — sem ele todo `MeshPhongMaterial` renderiza **preto**.
3. **Use `globe.getCoords(lat,lng,alt)`**, nunca uma conversão própria. O three-globe usa `theta = 90 - lng`, não `lng + 180` — uma versão à mão rotaciona tudo 90°.
4. **`.mm` (raiz do marcador): sem `transform`, `pointer-events: none`.** O globe.gl usa `transform` ali pra posicionar. Animação e ponteiro vão no filho `.mm-in`.
5. **Sempre crie array novo** ao trocar dados de camada — globe.gl compara por referência.
6. **Um `requestAnimationFrame` só**, com buffers iterados em **ordem reversa** (permite `splice` no meio).
7. **`mesh.up = normal da esfera` ANTES de `lookAt()`** — senão o modelo rola de lado.
8. **Nada de `requestIdleCallback`** — o rAF do globo impede o browser de ficar idle; o callback nunca dispara.
9. **`getPointAt(Math.min(0.999, t))`** — `t = 1.0` exato quebra.
10. **Todo `splice()` acompanhado de `orbitas.remove()`.**

---

## 2. Setup

```js
import Globe from 'globe.gl';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import * as THREE from 'three';

const TEX = 'https://cdn.jsdelivr.net/npm/three-globe/example/img';

const globe = Globe({ extraRenderers: [new CSS2DRenderer()] })(container)
  .backgroundColor('rgba(0,0,0,0)')
  .globeImageUrl(`${TEX}/earth-blue-marble.jpg`)
  .bumpImageUrl(`${TEX}/earth-topology.png`)
  .showAtmosphere(true).atmosphereColor('#4aa8ff').atmosphereAltitude(0.22);

globe.globeMaterial().bumpScale = 6;

const ctrl = globe.controls();
ctrl.autoRotate = true; ctrl.autoRotateSpeed = 0.22;
ctrl.enableZoom = true; ctrl.minDistance = 170; ctrl.maxDistance = 520;
container.addEventListener('pointerenter', () => { ctrl.autoRotate = false; });
container.addEventListener('pointerleave', () => { ctrl.autoRotate = true; });
globe.pointOfView({ lat: 22, lng: -55, altitude: 2.3 }, 0);

const R = globe.getGlobeRadius();
const vetor = (lat, lng, alt = 0.01) => {
  const c = globe.getCoords(lat, lng, alt);   // REGRA 3
  return new THREE.Vector3(c.x, c.y, c.z);
};

const orbitas = new THREE.Group();
globe.scene().add(orbitas);
globe.scene().add(luzes());                    // REGRA 2
const sats = [], missoes = [], explosoes = [], nukes = [], ondas = [];
```

| Parâmetro | Valor | Porquê |
|---|---|---|
| `atmosphereAltitude` | `0.22` | halo grosso, cinematográfico |
| `bumpScale` | `6` | relevo exagerado (padrão do three-globe é ~1) |
| `autoRotateSpeed` | `0.22` | giro de "planeta vivo"; para no hover |
| `minDistance/maxDistance` | `170 / 520` | trava o zoom entre "país na tela" e "globo com folga" |
| `htmlAltitude` | `0.03` | cápsulas flutuam 3% do raio acima do solo |
| `arcAltitudeAutoScale` | `0.45` | curvatura do arco proporcional à distância |
| foco de câmera | `altitude 1.6`, `900ms` | voo de câmera ao selecionar |

---

## 3. Materiais e luz

**A lição:** a v1 usava `MeshBasicMaterial` — material que **ignora luz**. Sem sombreamento, qualquer contagem de polígonos vira silhueta chapada. `MeshPhongMaterial + flatShading` resolve: cada face pega a luz num ângulo diferente e o volume aparece sozinho, mantendo o facetado low-poly.

```js
// Material padrão: facetado, brilho especular discreto.
const mat = (cor, opts = {}) => new THREE.MeshPhongMaterial({
  color: cor, flatShading: true, shininess: 28, specular: 0x223344, ...opts,
});
// Material sem luz — só pra coisas que EMITEM: chama, luz de navegação, traçante.
const emissivo = (cor, opts = {}) => new THREE.MeshBasicMaterial({ color: cor, ...opts });

// Rig de 3 pontos. Sem isto o Phong fica preto.
export function luzes() {
  const g = new THREE.Group();
  g.add(new THREE.AmbientLight(0x93b4d8, 1.1));             // preenchimento frio
  const chave = new THREE.DirectionalLight(0xffffff, 1.5);   // principal
  chave.position.set(1, 1, 1); g.add(chave);
  const contra = new THREE.DirectionalLight(0x35e0ff, 0.7);  // contraluz ciano do jogo
  contra.position.set(-1, -0.5, -1); g.add(contra);
  return g;
}
```

**Duas convenções obrigatórias:**
- **Eixo:** todo modelo aponta o nariz/proa para **+Z**, com **+Y** para cima. É o que faz `lookAt()` funcionar.
- **Peças vivas:** `.name = 'chama' | 'radar' | 'helice' | 'pisca'` são achadas por `getObjectByName()` no loop e animadas.

---

## 4. Modelos 3D (`ui/modelos3d.js`)

Todos construídos à mão em three.js. Nenhum asset externo.

### 4.1 Caça (furtivo, tipo F-35)

```js
export function caca(cor = 0xdfe8ff, escala = 1) {
  const g = new THREE.Group();
  const escuro = new THREE.Color(cor).multiplyScalar(0.62).getHex();

  // fuselagem achatada (caça furtivo é chato, não cilíndrico)
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.62, 4.6, 6), mat(cor));
  corpo.rotation.x = Math.PI / 2; corpo.scale.set(1, 1, 0.55); g.add(corpo);

  const nariz = new THREE.Mesh(new THREE.ConeGeometry(0.75, 2.4, 6), mat(cor));
  nariz.rotation.x = Math.PI / 2; nariz.position.z = 3.5; nariz.scale.set(1, 1, 0.55); g.add(nariz);

  // canopy translúcida — o detalhe que faz o olho ler "avião"
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(0x7fd4ff, { transparent: true, opacity: 0.75, shininess: 90 }));
  canopy.position.set(0, 0.34, 1.7); canopy.scale.set(0.85, 0.8, 2.1); g.add(canopy);

  // asa delta: BufferGeometry de 2 triângulos crus
  const asaG = new THREE.BufferGeometry();
  asaG.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 1.6, -4.0, 0, -1.4, 0, 0, -2.2,   // esquerda
    0, 0, 1.6,  4.0, 0, -1.4, 0, 0, -2.2,   // direita
  ], 3));
  asaG.computeVertexNormals();
  g.add(new THREE.Mesh(asaG, mat(cor, { side: THREE.DoubleSide })));

  // estabilizadores em V (assinatura do furtivo)
  for (const lado of [-1, 1]) {
    const estG = new THREE.BufferGeometry();
    estG.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, -1.6, lado * 1.1, 1.3, -2.6, 0, 0, -2.8,
    ], 3));
    estG.computeVertexNormals();
    const est = new THREE.Mesh(estG, mat(escuro, { side: THREE.DoubleSide }));
    est.position.x = lado * 0.5; g.add(est);
  }

  for (const lado of [-1, 1]) {   // entradas de ar
    const ar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 1.5), mat(escuro));
    ar.position.set(lado * 0.72, -0.1, 0.9); g.add(ar);
  }

  const bocal = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.55, 0.7, 8), mat(0x40485a));
  bocal.rotation.x = Math.PI / 2; bocal.position.z = -2.4; g.add(bocal);

  // pós-combustão: EMISSIVA, pulsa no loop
  const fogo = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.4, 8),
    emissivo(0x59e6ff, { transparent: true, opacity: 0.8 }));
  fogo.rotation.x = -Math.PI / 2; fogo.position.z = -3.7; fogo.name = 'chama'; g.add(fogo);

  g.scale.setScalar(escala);
  return g;
}
```
**Mágicos:** `multiplyScalar(0.62)` = peças secundárias 38% mais escuras que a cor base; cilindro de **6 lados** + `scale.z 0.55` = fuselagem achatada facetada.

### 4.2 Navio de guerra (destróier)

```js
export function navio(cor = 0xb8c6de, escala = 1) {
  const g = new THREE.Group();
  const escuro  = new THREE.Color(cor).multiplyScalar(0.7).getHex();
  const conves  = new THREE.Color(cor).multiplyScalar(0.5).getHex();

  g.add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.15, 8.4), mat(cor)));        // casco
  const fundo = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 7.6), mat(escuro));
  fundo.position.y = -0.75; g.add(fundo);

  // proa em cunha: cone de 4 faces girado 45°
  const proa = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.8, 4), mat(cor));
  proa.rotation.x = Math.PI / 2; proa.rotation.z = Math.PI / 4;
  proa.position.z = 5.4; proa.scale.y = 0.55; g.add(proa);

  const cv = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.12, 8.5), mat(conves));
  cv.position.y = 0.62; g.add(cv);

  // superestrutura escalonada em 3 níveis — a silhueta de navio de guerra
  const n1 = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.9, 3.2), mat(cor));
  n1.position.set(0, 1.1, 0.6); g.add(n1);
  const n2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 2.0), mat(cor));
  n2.position.set(0, 1.9, 1.0); g.add(n2);
  const ponte = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.2),
    mat(0x7fd4ff, { transparent: true, opacity: 0.8, shininess: 80 }));
  ponte.position.set(0, 2.5, 1.4); g.add(ponte);

  const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 2.6, 6), mat(escuro));
  mastro.position.set(0, 3.9, 1.0); g.add(mastro);
  const radar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.1),
    emissivo(0x35e0ff, { transparent: true, opacity: 0.85 }));
  radar.position.set(0, 4.4, 1.0); radar.name = 'radar'; g.add(radar);   // gira no loop

  const chamine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.9), mat(escuro));
  chamine.position.set(0, 1.9, -0.8); g.add(chamine);

  for (const z of [3.0, -2.6]) {   // lançadores verticais (VLS)
    const vls = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 1.1), mat(0x4a5568));
    vls.position.set(0, 0.72, z); g.add(vls);
  }

  const torreta = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.45, 8), mat(cor));
  torreta.position.set(0, 0.9, 4.0); g.add(torreta);
  const canhao = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 6), mat(0x6f819c));
  canhao.rotation.x = Math.PI / 2; canhao.position.set(0, 1.0, 4.8); g.add(canhao);

  const heli = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 1.8), mat(0x39424f));
  heli.position.set(0, 0.7, -3.4); g.add(heli);

  g.scale.setScalar(escala);
  return g;
}
```
**Mágicos:** três tons derivados da cor base (`1.0` casco / `0.7` escuro / `0.5` convés); `ConeGeometry(...,4)` + `rotation.z = π/4` = pirâmide virando cunha de proa.

### 4.3 Submarino

```js
export function submarino(cor = 0x5a6a80, escala = 1) {
  const g = new THREE.Group();
  const escuro = new THREE.Color(cor).multiplyScalar(0.65).getHex();

  const casco = new THREE.Mesh(new THREE.CapsuleGeometry(0.85, 5.6, 6, 12), mat(cor));
  casco.rotation.x = Math.PI / 2; g.add(casco);
  const popa = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.8, 10), mat(cor));
  popa.rotation.x = -Math.PI / 2; popa.position.z = -3.9; g.add(popa);

  const vela = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.5, 2.0), mat(escuro));
  vela.position.set(0, 1.0, 0.8); g.add(vela);
  const velaTopo = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.0, 6), mat(escuro));
  velaTopo.rotation.x = Math.PI / 2; velaTopo.position.set(0, 1.72, 0.8); g.add(velaTopo);
  const peri = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 4), mat(0x2a3140));
  peri.position.set(0, 2.3, 0.5); g.add(peri);

  const planos = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 0.55), mat(escuro));
  planos.position.set(0, 1.15, 0.8); g.add(planos);

  const lemeV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.9, 1.0), mat(escuro));
  lemeV.position.set(0, 0, -3.6); g.add(lemeV);
  const lemeH = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.0), mat(escuro));
  lemeH.position.set(0, 0, -3.6); g.add(lemeH);

  const helice = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.6, 7), mat(0x8a7a55));  // bronze
  helice.rotation.x = -Math.PI / 2; helice.position.z = -4.7; helice.name = 'helice'; g.add(helice);

  // luz de casco — OBRIGATÓRIA: sem ela o submarino some no azul do oceano
  const luz = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), emissivo(0x35e0ff));
  luz.position.set(0, 1.9, 1.4); g.add(luz);

  g.scale.setScalar(escala);
  return g;
}
```

### 4.4 Porta-aviões

```js
export function portaAvioes(cor = 0x9fb0c8, escala = 1) {
  const g = new THREE.Group();
  const escuro = new THREE.Color(cor).multiplyScalar(0.68).getHex();

  g.add(new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.4, 12), mat(cor)));
  const proa = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.4, 4), mat(cor));
  proa.rotation.x = Math.PI / 2; proa.rotation.z = Math.PI / 4;
  proa.position.z = 6.8; proa.scale.y = 0.42; g.add(proa);

  // convés de voo MAIS LARGO que o casco — é a característica visual
  const conves = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.22, 13.4), mat(0x4e5867));
  conves.position.y = 0.8; g.add(conves);

  // convés angulado a bombordo — 0.16 rad ≈ 9°, o ângulo real
  const angulado = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 7.0), mat(0x454e5c));
  angulado.position.set(-1.6, 0.82, 1.4); angulado.rotation.y = 0.16; g.add(angulado);

  for (const x of [-0.6, 0.9]) {   // faixas das catapultas
    const cat = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 6.4),
      emissivo(0xdfe8ff, { transparent: true, opacity: 0.45 }));
    cat.position.set(x, 0.93, 3.0); g.add(cat);
  }

  const ilha = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.6, 2.4), mat(cor));
  ilha.position.set(2.0, 1.7, -1.4); g.add(ilha);          // deslocada a estibordo
  const ponte = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 1.4),
    mat(0x7fd4ff, { transparent: true, opacity: 0.8 }));
  ponte.position.set(2.0, 2.2, -1.0); g.add(ponte);
  const radar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.08),
    emissivo(0x35e0ff, { transparent: true, opacity: 0.8 }));
  radar.position.set(2.0, 3.9, -1.4); radar.name = 'radar'; g.add(radar);

  // REUSA caca() em escala 0.2 pros aviões estacionados: [x, z, rotaçãoY]
  for (const [x, z, rot] of [[-1.7, 4.6, 0.5], [-1.0, 2.4, 0.2], [1.2, -3.4, -0.4], [1.9, -4.8, -0.7]]) {
    const a = caca(0xcfdcf0, 0.2);
    a.position.set(x, 0.98, z); a.rotation.y = rot; g.add(a);
  }

  g.scale.setScalar(escala);
  return g;
}
```

### 4.5 Míssil e satélite

```js
export function missil(escala = 1) {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.6, 7), mat(0xe8eef8));
  corpo.rotation.x = Math.PI / 2; g.add(corpo);
  const ogiva = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 7), mat(0xff6b4a));
  ogiva.rotation.x = Math.PI / 2; ogiva.position.z = 1.05; g.add(ogiva);
  for (const ang of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {   // 4 aletas em cruz
    const aleta = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.4), mat(0xb9c4d4));
    aleta.position.set(Math.cos(ang) * 0.3, Math.sin(ang) * 0.3, -0.65);
    aleta.rotation.z = ang; g.add(aleta);
  }
  const escape = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.9, 6),
    emissivo(0xffb020, { transparent: true, opacity: 0.9 }));
  escape.rotation.x = -Math.PI / 2; escape.position.z = -1.25; escape.name = 'chama'; g.add(escape);
  g.scale.setScalar(escala);
  return g;
}

export function satelite(escala = 1) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 2.4), mat(0xdfe8ff)));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.5, 2.45), mat(0xd4a843)));  // manta térmica dourada
  for (const lado of [-1, 1]) {
    for (let i = 0; i < 2; i += 1) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.6), mat(0x1e5fa8, { shininess: 90 }));
      p.position.set(lado * (1.1 + i * 1.6), 0, 0); g.add(p);
      const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 4), mat(0x8899aa));
      haste.rotation.z = Math.PI / 2; haste.position.set(lado * (0.5 + i * 1.6), 0, 0); g.add(haste);
    }
  }
  // antena parabólica = calota (phiLength π/2.4)
  const prato = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.4),
    mat(0xeef4ff, { side: THREE.DoubleSide }));
  prato.rotation.x = Math.PI; prato.position.y = -0.95; g.add(prato);
  const luz = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), emissivo(0xff3b5c));
  luz.position.set(0, 0.75, 1.2); luz.name = 'pisca'; g.add(luz);
  g.scale.setScalar(escala);
  return g;
}

export const MODELOS = { caca, navio, submarino, portaAvioes, satelite, missil };
```

**Escalas de uso:** `caca 0.5` · `navio 0.4` · `submarino 0.4` · `portaAvioes 0.28` · `missil 0.6` (salva) / `0.9` (ICBM) · `satelite 1`.

---

## 5. Camadas do globe.gl

| Camada | Dados | Representa |
|---|---|---|
| `polygonsData` | países (`/paises-110m.geojson`) **+** estados abertos (`/estados.geojson`) — array híbrido | Território. Cor = relação/guerra (país) ou dono (estado) |
| `labelsData` | países jogáveis ou `POP_EST > 4e7` | Sigla ISO2. **Removida** de quem está aberto em estados |
| `arcsData` | `[...arcosMundo, ...arcos]` | Ações do jogador (efêmeras) + guerras NPC (persistentes) |
| `ringsData` | `focos` | Radar de conflito |
| `htmlElementsData` | `marcadores` | Cápsulas CSS2D `.mm/.mm-in`. **Exige CSS2DRenderer** |
| `pointsData` | cidades + pontinhos de tropa | Só quando há estados abertos |

### A camada mista (países e estados juntos)

O globe.gl só tem **uma** camada de polígonos. Para o Brasil se partir em 27 estados enquanto o resto do mundo continua liso, monte **um array híbrido**:

```js
function pintarCamada() {
  const abertos = paisesAbertos();                                  // Set de ISOs
  const paisesLisos   = features.filter((f) => !abertos.has(iso(f)));
  const estadosAbertos = estadosGeo.filter((f) => abertos.has(f.properties.pais));
  const mistura = [...paisesLisos, ...estadosAbertos];

  const ehEstado = (f) => Boolean(f?.properties?.id && f.properties.pais);

  globe
    .polygonsData(mistura)
    // Um accessor, dois tipos de feature. Cada um sabe se pintar.
    .polygonCapColor((f) => {
      if (ehEstado(f)) return corEstado(jogo.estado, f);
      return iso(f) === selecionado ? 'rgba(53, 224, 255, 0.55)' : corPais(jogo.estado, f, realista);
    })
    .polygonAltitude((f) => {
      if (ehEstado(f)) return alturaEstado(jogo.estado, f);
      return iso(f) === selecionado ? 0.035 : altitudeDe(jogo.estado, f);
    })
    .labelsData(features.filter((f) => iso2(f) && !abertos.has(iso(f)) && /* ... */));
}
```

### Cor e altitude do país

```js
function corPais(estado, f, realista) {
  const code = iso(f);
  if (souEu(code)) return 'rgba(255, 200, 60, 0.30)';
  if (estaOcupado(estado, code)) return 'rgba(255, 150, 40, 0.55)';
  if ((estado.emGuerra || []).includes(code)) return 'rgba(255, 59, 92, 0.55)';
  const r = relacaoAtual(estado, f);
  if (realista) {                                    // modo SATÉLITE: a Terra tem de aparecer
    if (r >= 30) return 'rgba(34, 224, 160, 0.16)';
    if (r <= -30) return 'rgba(255, 59, 92, 0.18)';
    return 'rgba(0,0,0,0)';                          // neutro TOTALMENTE transparente
  }
  if (r >= 30) return 'rgba(34, 224, 160, 0.5)';     // modo POLÍTICO: o polígono é o mapa
  if (r <= -30) return 'rgba(255, 59, 92, 0.45)';
  if (r <= -1) return 'rgba(255, 176, 32, 0.28)';
  return 'rgba(53, 224, 255, 0.14)';
}

function altitudeDe(estado, f) {
  const code = iso(f);
  if (estaOcupado(estado, code)) return 0.012;
  if ((estado.emGuerra || []).includes(code)) return 0.012;
  return 0.006;
}
```
**Precedência:** eu → ocupado → em guerra → relação.
**Altitudes:** base `0.006` · guerra/ocupação `0.012` · hover `0.03` · **selecionado `0.035`** (acima do hover, pra nunca "abaixar" quando o mouse sai).

---

## 6. Camada tática (`ui/tatico.js`)

Gramática de **4 cores** e pronto. Mapa tático com paleta de arco-íris é bonito no print e inútil na decisão.

```js
export function classificar(estado, idEstado) {
  const eu = estado.iso || 'USA';
  const dono = donoDe(estado, idEstado);
  const natural = estadoPorId(idEstado)?.pais || idEstado.split('-')[0];
  if (dono === eu && natural === eu) return 'meu';
  if (dono === eu) return 'conquistado';
  if (natural === eu) return 'perdido';
  return 'terceiro';
}

const CORES = {
  meu:         { cap: 'rgba(53,224,255,.42)',  linha: 'rgba(120,235,255,.85)' },  // ciano
  conquistado: { cap: 'rgba(255,176,32,.42)',  linha: 'rgba(255,205,110,.85)' },  // âmbar
  perdido:     { cap: 'rgba(255,59,92,.46)',   linha: 'rgba(255,120,150,.9)'  },  // vermelho
  terceiro:    { cap: 'rgba(120,144,180,.14)', linha: 'rgba(150,175,210,.28)' },  // cinza
};

// Território com tropa fica mais alto: relevo é leitura instantânea de "aqui tem gente".
export function alturaEstado(estado, f) {
  const fc = forcaGuarnicao(guarnicao(estado, f.properties.id));
  if (!fc) return 0.006;
  return Math.min(0.05, 0.008 + fc / 400);
}
```

### Pontinhos de tropa — espiral áurea + escala log

```js
// Um enxame comunica "muita gente aqui" mais rápido que "80.000".
function pontinhosDeTropa(centro, n, cor, rot) {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    // espiral DETERMINÍSTICA: mesmo estado, mesmo desenho a cada frame.
    // Math.random aqui faria a tropa TREMER no mapa.
    const a = i * 2.399963;              // ângulo áureo (137,5°) — nunca repete direção
    const r = 0.55 + Math.sqrt(i) * 0.42; // raio ∝ √índice = densidade uniforme
    pts.push({
      tipo: 'tropa', cor, rot,
      lat: centro.lat + Math.sin(a) * r,
      lng: centro.lng + Math.cos(a) * r * 1.35,   // 1.35 compensa a compressão de longitude
    });
  }
  return pts;
}

function quantosPontos(forca) {
  if (forca <= 0) return 0;
  // O ×100 existe porque a força de infantaria é minúscula (poder de 1 soldado = 0.00008):
  // sem ele, o Rio com 7.000 homens dava força 0,8 → log10(1,8) → DOIS pontinhos.
  return Math.max(2, Math.min(13, Math.round(Math.log10(forca * 100 + 1) * 4)));
}

// VERDE = tropa defendendo (sua). VERMELHO = tropa de quem tomou de você.
// A cor responde "isto me protege ou me ameaça?", não "de que país é".
const cor = cls === 'meu' || cls === 'conquistado' ? '#22e0a0' : '#ff3b5c';
```

**Cidades:** capital nacional `#ffd76a` r=`0.28` · capital estadual `#9fd8ff` r=`0.18` · comum `rgba(200,220,255,.5)` r=`0.1`. Nome **só no hover** (via `pointLabel`).

---

## 7. Animações

### 7.1 Domínios de movimento — a física por meio

```js
// BUG QUE ISTO CONSERTA: os navios seguiam a MESMA curva aérea dos caças e voavam
// por cima do planeta. Um porta-aviões a 40 km de altitude não é estilo, é erro.
const DOMINIO = {
  ataque:    { alt: 0.02,   arco: 0.40,  vel: 0.0055 },
  aereo:     { alt: 0.02,   arco: 0.40,  vel: 0.0055 },
  missil:    { alt: 0.02,   arco: 0.55,  vel: 0.0140 },
  naval:     { alt: 0.002,  arco: 0.004, vel: 0.0022 },
  frota:     { alt: 0.002,  arco: 0.004, vel: 0.0018 },
  submarino: { alt: -0.004, arco: 0.0,   vel: 0.0026 },   // NEGATIVO: some dentro do oceano
};
```
`alt` = fração do raio. `vel` = incremento de `t` por frame (`t` vai 0→1): `0.0055` ≈ 3s a 60fps.

### 7.2 Esquadrilha

```js
function lancarEsquadrilha(alvo, tipo = 'ataque', origem = null) {
  const dom = DOMINIO[tipo] || DOMINIO.aereo;
  const p0 = vetor(eu.lat, eu.lng, dom.alt);
  const p1 = vetor(c.lat, c.lng, dom.alt);
  const dist = p0.distanceTo(p1);

  let curva, velCurva = dom.vel;
  if (dom.arco <= 0.01) {
    // MAR: rota marítima de verdade (A* sobre máscara de terra) — contorna a África,
    // cruza Suez, respeita o planeta.
    const rota = rotaMaritima(eu, c);
    if (rota && rota.length > 2) {
      const pts = rota.map((p) => vetor(p.lat, p.lng, dom.alt));
      curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal');  // evita loops/cúspides
      // rota costeira longa não pode durar o mesmo que um estreito
      velCurva = Math.max(0.0007, Math.min(dom.vel, 0.11 / rota.length));
    } else { /* fallback: grande círculo rasante */ }
  } else {
    // AR: apogeu PROPORCIONAL à distância, com teto no arco do domínio.
    // Mais rasante quando a origem é perto = "decolou aqui do lado".
    const altura = R * (1 + dom.alt + Math.min(dom.arco, dist / (R * 5)));
    const meio = p0.clone().add(p1).multiplyScalar(0.5).normalize().multiplyScalar(altura);
    curva = new THREE.QuadraticBezierCurve3(p0, meio, p1);
  }

  const n = tipo === 'ataque' ? 3 : tipo === 'naval' ? 2 : 1;
  for (let i = 0; i < n; i += 1) {
    missoes.push({
      mesh: criar(), curva, t: -i * 0.07,   // t NEGATIVO = atraso de largada (formação)
      vel: velCurva, tipo, alvo: c,
      impacta: tipo === 'ataque' && i === n - 1,   // só o ÚLTIMO explode
    });
  }
}
```

### 7.3 ICBM + interceptação

```js
// Um lançamento nuclear tem de PARECER diferente de tudo.
function lancarOgiva(alvo, origem = null, aoDetonar = null, opts = {}) {
  focar(alvo);   // a câmera precisa TESTEMUNHAR
  const p0 = vetor(eu.lat, eu.lng, 0.02);
  const p1 = vetor(c.lat, c.lng, 0.02);
  // apogeu R×1.9 — um ICBM risca o espaço, não plana como um caça (3,5× o arco de um caça)
  const meio = p0.clone().add(p1).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.9);
  const curva = new THREE.QuadraticBezierCurve3(p0, meio, p1);

  const traco = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curva.getPoints(60)),
    new THREE.LineBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.9 }));
  traco.geometry.setDrawRange(0, 2);   // criada inteira, revelada progressivamente
  orbitas.add(traco);

  // INTERCEPTAÇÃO na REENTRADA (68–76% do caminho), não na subida
  const interceptaEm = opts.interceptado ? 0.68 + Math.random() * 0.08 : null;
  missoes.push({ mesh: MODELOS.missil(0.9), traco, curva, t: 0, vel: 0.006, tipo: 'ogiva',
    alvo: c, impacta: false, interceptaEm, aoInterceptar: opts.aoInterceptar,
    aoChegar: () => { detonacaoNuclear(c); aoDetonar?.(); } });
}

// Clarão CIANO de plasma — a defesa venceu. Nunca vermelho.
function interceptacaoNuclear(pos, c) {
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 14),
    new THREE.MeshBasicMaterial({ color: 0x8ff0ff, transparent: true, opacity: 1 }));
  flash.position.copy(pos); orbitas.add(flash); explosoes.push({ mesh: flash, t: 0 });
  const nucleo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 }));
  nucleo.position.copy(pos); orbitas.add(nucleo); explosoes.push({ mesh: nucleo, t: 0 });
  ondaRadar(c, { cor: 0x35e0ff, max: 130 });   // varredura defensiva em duas camadas
  ondaRadar(c, { cor: 0x8ff0ff, max: 80 });
}
```
**A técnica do rastro:** a linha nasce **inteira** (60 pontos) com `setDrawRange(0, 2)` escondendo tudo; o loop revela progressivamente. Zero realocação de geometria.

### 7.4 Detonação nuclear — os 5 elementos

```js
function detonacaoNuclear(c) {
  const base = vetor(c.lat, c.lng, 0.005);
  const normal = base.clone().normalize();
  const grupo = new THREE.Group();

  // 1) FLASH — esfera branca cegante
  const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 }));
  flash.position.copy(base); grupo.add(flash);

  // 2) BOLA DE FOGO
  const fogo = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.95 }));
  fogo.position.copy(base); grupo.add(fogo);

  // 3) COLUNA do cogumelo — topo mais FINO que a base
  const coluna = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.1, 8, 10),
    new THREE.MeshBasicMaterial({ color: 0xd8925a, transparent: true, opacity: 0 }));
  coluna.position.copy(base.clone().add(normal.clone().multiplyScalar(R * 0.04)));
  // QUATERNION 1: cilindro nasce em +Y, gira pra apontar pra FORA da esfera.
  // É o que faz o cogumelo subir "pra cima" em qualquer ponto do globo.
  coluna.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  grupo.add(coluna);

  // 4) CHAPÉU
  const chapeu = new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0xe0a868, transparent: true, opacity: 0 }));
  chapeu.position.copy(base.clone().add(normal.clone().multiplyScalar(R * 0.08)));
  grupo.add(chapeu);

  // 5) ONDA DE CHOQUE — anel rasante
  const onda = new THREE.Mesh(new THREE.TorusGeometry(1, 0.25, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.85 }));
  onda.position.copy(base);
  // QUATERNION 2: torus nasce no plano XY (eixo +Z), gira pra ficar RASANTE ao solo.
  onda.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  grupo.add(onda);

  orbitas.add(grupo);
  nukes.push({ grupo, flash, fogo, coluna, chapeu, onda, normal, base, t: 0 });
}
```

**Todos `MeshBasicMaterial`** — explosão **emite**, não recebe luz.

#### As fases no loop (`t += 0.006` ⇒ ~4 segundos)

```js
for (let i = nukes.length - 1; i >= 0; i -= 1) {
  const k = nukes[i];
  k.t += 0.006;
  if (k.t >= 1) { orbitas.remove(k.grupo); nukes.splice(i, 1); continue; }
  const t = k.t;
  // FLASH: estoura nos primeiros 8% e trava
  k.flash.scale.setScalar(1 + Math.min(t, 0.08) * 90);
  k.flash.material.opacity = t < 0.08 ? 1 : Math.max(0, 0.5 - (t - 0.08) * 6);
  // BOLA DE FOGO
  k.fogo.scale.setScalar(1 + t * 14);
  k.fogo.material.opacity = Math.max(0, 0.95 - t * 1.3);
  // ONDA DE CHOQUE: a que abre mais (×61)
  k.onda.scale.setScalar(1 + t * 60);
  k.onda.material.opacity = Math.max(0, 0.85 - t * 0.95);
  // COGUMELO: sobe a partir de 12%
  if (t > 0.12) {
    const u = (t - 0.12) / 0.88;
    // A gramática da opacidade: min(teto, u×rampa) × (1 - u×decaimento)
    // = "aparece rápido → persiste → dissolve" numa expressão só.
    k.coluna.material.opacity = Math.min(0.75, u * 1.2) * (1 - u * 0.5);
    k.coluna.scale.set(1 + u * 0.5, 1 + u * 2.2, 1 + u * 0.5);
    k.coluna.position.copy(k.base.clone().add(k.normal.clone().multiplyScalar(R * (0.04 + u * 0.06))));
    k.chapeu.material.opacity = Math.min(0.7, u * 1.1) * (1 - u * 0.4);
    k.chapeu.scale.setScalar(1 + u * 1.6);
    k.chapeu.position.copy(k.base.clone().add(k.normal.clone().multiplyScalar(R * (0.09 + u * 0.09))));
  }
}
```

| Fase | Janela | Escala final | Opacidade |
|---|---|---|---|
| **Flash** | 0–8% (≈0,3s) | ×8.2 e congela | `1` até 8%, some em ~16% |
| **Bola de fogo** | 0–73% | ×15 | `0.95 - t×1.3` |
| **Onda de choque** | 0–89% | **×61** (a maior) | `0.85 - t×0.95` |
| **Coluna** | 12%–100% | Y ×3.2, XZ ×1.5 | sobe e desvanece |
| **Chapéu** | 12%–100% | ×2.6 | idem |

Coluna sobe de `R×0.04` a `R×0.10`; chapéu de `R×0.09` a `R×0.18` — o chapéu sempre acima, o gap cresce.

### 7.5 Onda de radar

```js
function ondaRadar(c, { cor = 0x35e0ff, max = 100, alt = 0.006 } = {}) {
  const base = vetor(c.lat, c.lng, alt);
  const anel = new THREE.Mesh(new THREE.TorusGeometry(1, 0.18, 8, 48),
    new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9 }));
  anel.position.copy(base);
  anel.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), base.clone().normalize());
  orbitas.add(anel);
  ondas.push({ mesh: anel, t: 0, max });
}
// loop: t += 0.022 (~0,76s) · scale = 1 + t×max · opacity = 0.9 × (1-t)
```

### 7.6 Radar de conflito (`ringsData`)

```js
.ringColor((d) => (t) => `${d.cor || 'rgba(255,59,92,'}${(1 - t) * (d.forca || 1)})`)
.ringMaxRadius((d) => d.raio || 6)
.ringPropagationSpeed((d) => d.vel || 2.4)
.ringRepeatPeriod((d) => d.periodo || 700)
```
**O truque:** `ringColor` retorna uma **função de `t`** (0=centro, 1=borda). A `cor` é uma string **rgba incompleta** e o alpha é concatenado: `(1-t) × forca`.

| Foco | Cor | raio | vel | período |
|---|---|---|---|---|
| **Guerra** (onda A rápida) | `rgba(255,59,92,` | 14 | 3.4 | 460 |
| **Guerra** (onda B lenta) | `rgba(255,120,60,` | 9 | 1.7 | 900 |
| Ocupação calma | `rgba(255,150,40,` | 5.5 | 1.5 | 1300 |
| Ocupação crítica (≥60%) | `rgba(255,59,92,` | 8 | 2.8 | 600 |
| Tensão (rel ≤ -75) | `rgba(255,176,32,` | 4 | 1.1 | 1800 |
| Alerta temporário | `rgba(255,176,32,` | 6 | 2.2 | 750 |
| Pandemia | `rgba(185,140,255,` | 7 | 1.1 | 1500 |
| Zona radioativa | `rgba(120,230,90,` | 8 | 1.4 | 900 |

**A gramática:** guerra = **duas ondas sobrepostas** (rápida vermelha + lenta laranja) → varredura de radar real. Ameaça lenta = período longo + raio pequeno (tensão 1800ms/raio 4 = aviso discreto). Guerra = período curto + raio grande (460ms/raio 14 = alarme).

### 7.7 Arcos por tipo

```js
const CORES_LINHA = { foco: '#35e0ff', ataque: '#ff3b5c', comercio: '#22e0a0',
                      espionagem: '#b98cff', venda: '#ffb020' };
const arco = { startLat, startLng, endLat, endLng,
  cor: [cor, `${cor}00`],                    // gradiente sólido→transparente = direção
  vel: tipo === 'ataque' ? 900 : 2200 };     // violência tem pressa (2,4× mais rápido)
arcos = [...arcos, arco];                    // REGRA 5: array novo sempre
```

### 7.8 Satélites em órbita

```js
function montarSatelites(n) {
  for (let i = 0; i < n; i += 1) {
    const raio = R * 1.35 + i * 8;                       // cada órbita 8 unidades mais alta
    const incl = (Math.PI / 180) * (22 + i * 24);        // nunca coplanares
    const trilha = new THREE.Mesh(new THREE.TorusGeometry(raio, 0.14, 6, 100),
      new THREE.MeshBasicMaterial({ color: 0x35e0ff, transparent: true, opacity: 0.12 }));
    trilha.rotation.x = Math.PI / 2 - incl;
    orbitas.add(trilha); orbitas.add(MODELOS.satelite(1));
    sats.push({ mesh, trilha, raio, incl,
      fase: Math.random() * Math.PI * 2,                 // não largam juntos
      vel: 0.00018 + i * 0.00005 });
  }
}
// chamada: montarSatelites(Math.min(4, Math.floor(inteligencia / 25)))
// 1 satélite por 25 pontos de inteligência, teto 4 — a órbita é a barra de progresso
// do serviço secreto.
```

### 7.9 O loop principal

```js
(function anima() {
  const now = performance.now();

  for (const s of sats) {   // órbita circular inclinada, parametrizada em seno/cosseno
    const a = s.fase + now * s.vel;
    s.mesh.position.set(Math.cos(a) * s.raio,
                        Math.sin(a) * s.raio * Math.sin(s.incl),
                        Math.sin(a) * s.raio * Math.cos(s.incl));
    s.mesh.rotation.y += 0.008;
    const pisca = s.mesh.getObjectByName('pisca');
    if (pisca) pisca.visible = Math.sin(now * 0.006) > 0;   // ~1 Hz
  }

  for (let i = missoes.length - 1; i >= 0; i -= 1) {   // REGRA 6: ordem reversa
    const m = missoes[i];
    m.t += m.vel;

    if (m.interceptaEm && m.t >= m.interceptaEm) {     // abatida no ar
      interceptacaoNuclear(m.curva.getPointAt(Math.min(0.999, m.interceptaEm)), m.alvo);
      m.aoInterceptar?.();
      orbitas.remove(m.mesh); if (m.traco) orbitas.remove(m.traco);
      missoes.splice(i, 1); continue;
    }
    if (m.t >= 1) {
      if (m.impacta && m.alvo) impacto(m.alvo);
      if (m.aoChegar) m.aoChegar();                     // a ogiva detona aqui
      orbitas.remove(m.mesh); if (m.traco) orbitas.remove(m.traco);
      missoes.splice(i, 1); continue;
    }
    if (m.t < 0) continue;                              // ainda não largou (formação)

    const pos = m.curva.getPointAt(Math.min(0.999, m.t));   // REGRA 9
    m.mesh.position.copy(pos);
    const olhar = m.curva.getPointAt(Math.min(0.999, m.t + 0.01));
    // REGRA 7 — a ordem importa: `up` ANTES do lookAt, senão o modelo rola pro lado.
    // Um navio precisa ficar SEMPRE com a quilha pra baixo — o `up` dele é a normal
    // da esfera, que é literalmente "onde fica o fundo do mar".
    m.mesh.up.copy(pos.clone().normalize());
    m.mesh.lookAt(olhar);

    // peças vivas
    const chama = m.mesh.getObjectByName('chama');
    if (chama) chama.scale.z = 0.8 + Math.sin(now * 0.02) * 0.4;   // pulsa ~3Hz
    const radar = m.mesh.getObjectByName('radar');
    if (radar) radar.rotation.y += 0.06;                            // ~0.57 rot/s
    const helice = m.mesh.getObjectByName('helice');
    if (helice) helice.rotation.z += 0.25;                          // ~2.4 rot/s

    if (m.traco) {   // a cauda é desenhada até onde ele já passou
      m.traco.geometry.setDrawRange(0, Math.max(2, Math.floor(m.t * 48)));
      m.traco.material.opacity = 0.9 * (1 - m.t * 0.5);
    }
  }

  for (let i = explosoes.length - 1; i >= 0; i -= 1) {   // buffer genérico {mesh, t}
    const e = explosoes[i];
    e.t += 0.045;                                        // ~0,37s
    if (e.t >= 1) { orbitas.remove(e.mesh); explosoes.splice(i, 1); continue; }
    e.mesh.scale.setScalar(1 + e.t * 7);                 // cresce 8×
    e.mesh.material.opacity = 0.85 * (1 - e.t);
  }

  /* nukes — ver §7.4 · ondas — ver §7.5 */

  requestAnimationFrame(anima);
}());
```

⚠️ **`t` NÃO é delta-time.** Todas as velocidades são incremento por frame; num monitor de 144Hz tudo roda **2,4× mais rápido**. Se recriar, considere normalizar por `deltaTime`.

---

## 8. Marcadores CSS2D (`.mm` / `.mm-in`)

Contrato do objeto:
```js
{ lat, lng, tipo, svg, flag?, rot?, titulo?, tip? }
// tipo  → vira a classe CSS de .mm-in
// svg   → string SVG inline de ico(nome, tamanho)
// rot   → rótulo mono curto (número, %, sigla)
// tip   → HTML do cartão rico; SE EXISTE, substitui o title nativo
```

```js
.htmlElementsData(marcadores)
.htmlLat('lat').htmlLng('lng').htmlAltitude(0.03)
.htmlElement((d) => {
  const el = document.createElement('div');
  el.className = 'mm';                       // REGRA 4: SEM transform aqui!
  el.innerHTML = `<div class="mm-in ${d.tipo}">
      ${d.flag ? `<img class="mm-flag" src="${d.flag}" alt="">` : ''}
      <span class="mm-ic">${d.svg}</span>
      ${d.rot ? `<span class="mm-rot">${d.rot}</span>` : ''}
    </div>`;
  if (d.tip) {
    el.addEventListener('mouseenter', () => mostrarTipMarcador(d.tip));
    el.addEventListener('mouseleave', esconderTipMarcador);
  } else { el.title = d.titulo || ''; }
  return el;
});
```

```css
/* O .mm fica pointer-events:none pra o arraste do globo passar por ele, mas a
   CÁPSULA interna (.mm-in) reativa o ponteiro — senão nenhum hover de marcador
   dispara (era por isso que só o tooltip do país, que é label nativo, funcionava). */
.mm { pointer-events: none; }
.mm-in { pointer-events: auto; cursor: pointer; display: flex; align-items: center; gap: 4px;
  padding: 3px 6px; border-radius: 20px; background: rgba(5,7,13,.72);
  border: 1px solid var(--borda); backdrop-filter: blur(6px);
  box-shadow: 0 3px 12px rgba(0,0,0,.7); animation: marcaIn .35s ease both; }
@keyframes marcaIn { from { opacity: 0; transform: scale(.5); } }
.mm-flag { width: 13px; height: 9px; object-fit: cover; border-radius: 1px; }
.mm-ic { display: flex; color: var(--cyan); }
.mm-rot { font-family: var(--mono); font-size: 8px; color: #e6ecff; letter-spacing: .04em; }

/* guerra: maior, com brilho pulsante (o "foguinho" virou espadas) */
.mm-in.guerra, .mm-in.guerra_npc {
  border-color: rgba(255,59,92,.85); background: rgba(30,7,12,.9);
  box-shadow: 0 0 16px -2px rgba(255,59,92,.75), inset 0 0 8px rgba(255,59,92,.25);
  padding: 4px 8px; animation: guerraPulsa 1.3s ease-in-out infinite; }
@keyframes guerraPulsa {
  0%,100% { box-shadow: 0 0 14px -3px rgba(255,59,92,.6), inset 0 0 8px rgba(255,59,92,.2); }
  50%     { box-shadow: 0 0 22px 0 rgba(255,59,92,.9), inset 0 0 10px rgba(255,59,92,.35); } }
.mm-in.nuke { border-color: rgba(255,176,32,.7); box-shadow: 0 0 14px -3px rgba(255,176,32,.6); }
.mm-in.nuke .mm-ic { color: var(--ambar); }
.mm-in.frota .mm-ic, .mm-in.aereo .mm-ic { color: #8fb4ff; }
.mm-in.capital { border-color: rgba(53,224,255,.6); box-shadow: 0 0 12px -3px rgba(53,224,255,.5); }
.mm-in.pandemia { border-color: rgba(185,140,255,.7); }
.mm-in.pandemia .mm-ic { color: #b98cff; }
.mm-in.radioativa { border-color: #78e65a; box-shadow: 0 0 16px -2px #78e65a;
  animation: piscar 1.1s steps(2) infinite; }
```

**`steps(2)` no `piscar`:** o keyframe é `50% { opacity: .3 }`, mas `steps(2)` transforma a interpolação suave num **liga/desliga digital** — luz de alarme, não respiração.

**Os tipos:** `capital` (star) · `guerra` (swords) · `guerra_npc` (swords, no meio do arco) · `frota` (ship) · `aereo` (plane) · `nuke` (radiation) · `tensao` (zap) · `ocupado` (flag) · `revolta` (triangle-alert) · `base` · `pandemia` (biohazard) · `radioativa` (radiation) · `alerta` (siren).

**Offsets do arsenal** (não ficam sobre a capital — se empilhariam):
```js
frota: { lat: eu.lat - 11, lng: eu.lng - 26 }
aereo: { lat: eu.lat + 11, lng: eu.lng + 16 }
nuke:  { lat: eu.lat + 4,  lng: eu.lng - 12 }
```

---

## 9. Tooltips

### 9.1 `.gt` — hover do país (label nativo via `polygonLabel`)

Hierarquia: **1. quem é** → **2. o que é pra mim** (a única coisa que decide se você clica) → **3. o que está em jogo** → **4. o que fazer**. Cada linha só aparece se tiver informação — *tooltip que mostra "Ogivas: 0" pra todo mundo é ruído*.

**A técnica central:** `style="--c:${cor}"` no raiz — **uma variável CSS pinta o cartão inteiro** (borda, glow, faixa, texto) sem uma classe por estado.

```css
.gt { width: 232px; border-radius: 10px; overflow: hidden; background: rgba(6,11,20,.95);
  border: 1px solid var(--c); backdrop-filter: blur(12px);
  box-shadow: 0 14px 44px rgba(0,0,0,.8), 0 0 30px -12px var(--c); }
.gt-faixa { padding: 7px 11px;
  background: color-mix(in srgb, var(--c) 15%, transparent);
  border-top: 1px solid color-mix(in srgb, var(--c) 35%, transparent); }
.gt-faixa b { color: var(--c); font-family: var(--disp); font-size: 12px; letter-spacing: .14em; }
/* o gap VIRA a linha divisória — sem border em nenhuma célula */
.gt-grade { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--borda); }
.gt-d { display: grid; grid-template-columns: 14px 1fr auto; gap: 6px; padding: 7px 10px; background: #0a1626; }
```
`color-mix(in srgb, var(--c) 15%, transparent)` — um token, três intensidades.

**Faixas:** ≥60 ALIADO · ≥30 PARCEIRO · -19..29 NEUTRO · ≤-20 TENSO · ≤-60 HOSTIL.

### 9.2 `.gt-conflito` — cartão flutuante que segue o mouse

```js
let tipEl = null;
function mostrarTipMarcador(html) {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'gt-conflito';
    document.body.appendChild(tipEl);
    document.addEventListener('mousemove', moverTip);   // registrado UMA vez (lazy)
  }
  tipEl.innerHTML = html;
  tipEl.style.display = 'block';
}
function moverTip(ev) {
  tipEl.style.left = `${Math.min(ev.clientX + 16, window.innerWidth - 260)}px`;
  tipEl.style.top  = `${Math.min(ev.clientY + 16, window.innerHeight - 160)}px`;
}
```

```css
.gt-conflito { position: fixed; z-index: 9998; display: none; width: 244px; padding: 12px 13px;
  border-radius: 10px; background: rgba(6,11,20,.96); border: 1px solid var(--perigo);
  backdrop-filter: blur(12px); box-shadow: 0 14px 44px rgba(0,0,0,.8);
  pointer-events: none;   /* OBRIGATÓRIO: senão rouba o próprio mouseleave que o esconde */
  animation: entrar .12s ease; }
.gtc-sub { display: inline-block; font-family: var(--mono); font-size: 8.5px; letter-spacing: .12em;
  padding: 2px 7px; border-radius: 20px; border: 1px solid var(--fraco); color: var(--fraco); }
.gtc-sub.gtc-guerra { border-color: var(--perigo); color: var(--perigo); }
.gtc-barra { height: 5px; border-radius: 3px; background: #0d1729; overflow: hidden; }
.gtc-barra i { display: block; height: 100%; background: linear-gradient(90deg, var(--ambar), var(--perigo)); }
.gtc-cta { font-family: var(--mono); font-size: 9px; color: var(--cyan); letter-spacing: .04em; }
```

**Anatomia:** `<b>título</b>` + `.gtc-sub` selo + `<p>` corpo + opcional `.gtc-barra` + opcional `.gtc-cta`.

**Truque:** os tooltips nativos do globe.gl (`polygonLabel`, `pointLabel`) **reusam** o CSS de `.gt-conflito` com `display:block; position:static` — o cartão flutuante vira conteúdo inline dentro do label nativo.

---

## 10. Efeitos de tela (`ui/efeitos.js`)

**Sem arquivos de áudio — Web Audio puro.**

```js
export function sirene({ ruim = false } = {}) {
  const ac = audio(); if (!ac) return;
  if (ac.state === 'suspended') ac.resume();     // política de autoplay
  const dur = 1.8, t0 = ac.currentTime;
  const osc = ac.createOscillator(), gain = ac.createGain();
  osc.type = 'sawtooth';                          // áspero, não musical
  const baixo = ruim ? 380 : 440;
  const alto  = ruim ? 720 : 880;                 // exatamente uma oitava
  for (let i = 0; i < 3; i++) {                   // 3 varreduras de 0,6s
    const t = t0 + i * (dur / 3);
    osc.frequency.setValueAtTime(baixo, t);
    osc.frequency.linearRampToValueAtTime(alto, t + dur / 6);
    osc.frequency.linearRampToValueAtTime(baixo, t + dur / 3);
  }
  gain.gain.setValueAtTime(0.0001, t0);
  // EXPONENCIAL: rampa linear pra zero CLICA. Daí o 0.0001 em vez de 0.
  gain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.05);
  gain.gain.setValueAtTime(0.14, t0 + dur - 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0); osc.stop(t0 + dur);
}

export function flashTela(ruim = false) {
  const div = document.createElement('div');
  div.className = `flash-tela ${ruim ? 'ruim' : 'bom'}`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 900);
}
```
```css
.flash-tela { position: fixed; inset: 0; z-index: 200; pointer-events: none;
  animation: flashFade .9s ease forwards; }
.flash-tela.bom  { background: radial-gradient(circle, rgba(53,224,255,.4), transparent 70%); }
.flash-tela.ruim { background: radial-gradient(circle, rgba(255,59,92,.5), transparent 70%); }
@keyframes flashFade { from { opacity: 1; } to { opacity: 0; } }

/* clarão nuclear em tela cheia */
.nk-clarao { position: fixed; inset: 0; z-index: 9999; pointer-events: none; background: #fff;
  animation: nkClarao 1.4s ease-out forwards; }
@keyframes nkClarao { 0% { opacity: 0; } 8% { opacity: 1; } 100% { opacity: 0; } }
```

---

## 11. Balão CSS2D — despacho que nasce no país e sobe

```js
function balao(coord, texto, tom = 'neutro') {
  const el = document.createElement('div');
  el.className = 'mm';                    // raiz limpa (REGRA 4)
  el.innerHTML = `<div class="bl-in ${tom}">${esc(texto)}</div>`;
  const obj = new CSS2DObject(el);
  // DISPERSÃO EM ANEL: empilhar no centro deixava três textos sobrepostos e ilegíveis.
  const ang = (balaoN * 2.39996) % (Math.PI * 2);   // ângulo áureo de novo
  balaoN += 1;
  const raio = 9 + Math.random() * 5;
  obj.position.copy(vetor(
    Math.max(-80, Math.min(80, coord.lat + Math.sin(ang) * raio)),   // trava nos polos
    coord.lng + Math.cos(ang) * raio * 1.4,
    0.07,                                                            // acima dos marcadores
  ));
  orbitas.add(obj);
  setTimeout(() => {
    el.querySelector('.bl-in')?.classList.add('sai');
    setTimeout(() => orbitas.remove(obj), 700);
  }, 3400);
}
```
```css
/* O erro da v2: caixas com fundo sólido empilhadas rápido — eram exatamente o que
   o loading existia pra evitar (algo tapando o globo). Agora: SEM fill, borda só na
   esquerda, texto com sombra pra ler sobre qualquer coisa. */
.bl-in { max-width: 240px; padding: 2px 0 2px 9px;
  background: none; border: none; border-left: 2px solid var(--borda-viva);
  font-size: 11px; line-height: 1.5; color: #dfe8ff;
  text-shadow: 0 1px 3px #000, 0 0 12px rgba(0,0,0,.9), 0 0 24px rgba(0,0,0,.7);
  animation: balaoSobe 1s cubic-bezier(.2,.8,.2,1) both; pointer-events: none; }
.bl-in.ruim  { border-left-color: var(--perigo); color: #ffd7de; }
.bl-in.aviso { border-left-color: var(--ambar);  color: #ffe9c6; }
.bl-in.bom   { border-left-color: var(--verde);  color: #c3f7e4; }
.bl-in.sai { animation: balaoSai 1.4s ease forwards; }
@keyframes balaoSobe { from { opacity: 0; transform: translateY(10px); } }
@keyframes balaoSai  { to { opacity: 0; transform: translateY(-38px); } }
```
**A técnica de legibilidade:** três `text-shadow` empilhados substituem o fundo sólido. Você lê o texto sobre qualquer coisa e continua vendo o caça passar por trás.

---

## 12. Dívidas técnicas conhecidas (não invenção — verificadas)

1. **`.mm-in.alerta` não tem CSS** — o tipo é emitido mas cai no estilo padrão da cápsula.
2. **`.mm-in.nuke` perdeu o `piscar`** — uma segunda passada do CSS redefine a regra sem a animação.
3. **"Destroços" em `interceptacaoNuclear`** existem só no comentário: são duas esferas, não partículas.
4. **Rastro do ICBM:** criado com `getPoints(60)`, revelado com `× 48` — completa em ~80% do voo.
5. **`balaoSai`** dura 1.4s mas o objeto é removido em 700ms — a saída é cortada pela metade.
6. **Três limiares de relação diferentes:** `corPais` usa ±30; o tooltip usa ±30/±60/-20; o marcador de tensão usa -55/-75.
7. **`DOMINIO[].cor`** é declarado nos seis domínios mas **nunca lido** — as cores vêm hardcoded em `lancarEsquadrilha`.
8. **`t` não é delta-time** (ver §7.9).
9. **CSS legado:** `.globo-tip`, `.gt-cab span`, `.gt-corpo` são da v1 do tooltip, não usados.
