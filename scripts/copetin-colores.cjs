// Genera el bloque de colores de marca de El Copetin sobre la plantilla
// Sabor a Pampa, que trae dorado y negro escritos a mano en cientos de reglas.
//
// Para cada regla de src/App.css que use esos colores, emite una copia
// restringida a .account-copetin-sandwich con los colores de la marca:
//   dorado  -> terracota claro (texto y filetes legibles sobre el azul)
//   negros  -> azul de la fachada / azul Copetin
// Se pega entre los marcadores al final de App.css (idempotente).
const fs = require("fs");
const path = require("path");
const postcss = require("postcss");

const CSS = path.join(__dirname, "..", "src", "App.css");
const INI = "/* === copetin-marca:inicio (generado por scripts/copetin-colores.cjs) === */";
const FIN = "/* === copetin-marca:fin === */";
const ACCOUNT = ".account-copetin-sandwich";

const REEMPLAZOS = [
  [/#f4b739/gi, "#E8A592"],
  [/rgba\(\s*244\s*,\s*183\s*,\s*57\s*,/gi, "rgba(232, 165, 146,"],
  [/#050706/gi, "#333945"],
  [/#030505/gi, "#333945"],
  [/#11100d/gi, "#40475E"],
  [/#0e0c08/gi, "#2B303B"],
  [/#101918/gi, "#40475E"],
  [/#0a0b09/gi, "#2B303B"],
];

const usaColores = (valor) => REEMPLAZOS.some(([re]) => { re.lastIndex = 0; return re.test(valor); });
const pintar = (valor) => REEMPLAZOS.reduce((v, [re, a]) => v.replace(re, a), valor);

const origen = fs.readFileSync(CSS, "utf8");
const sinBloque = origen.includes(INI) ? origen.slice(0, origen.indexOf(INI)).trimEnd() + "\n" : origen;
const raiz = postcss.parse(sinBloque);

// La clase de la cuenta va pegada al primer elemento del selector, y antes de
// un pseudo-elemento (::before no admite nada despues).
function enElPrimero(s) {
  const m = s.match(/^[^\s>+~]+/);
  const primero = m ? m[0] : s;
  const resto = s.slice(primero.length);
  const corte = primero.search(/::|:(before|after)/);
  const pegado = corte === -1 ? primero + ACCOUNT : primero.slice(0, corte) + ACCOUNT + primero.slice(corte);
  return pegado + resto;
}

function prefijar(selector) {
  return selector
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    // Los dos casos: la regla cuelga del contenedor, o apunta al propio contenedor.
    .flatMap((s) => (s.startsWith(ACCOUNT) ? [s] : [`${ACCOUNT} ${s}`, enElPrimero(s)]))
    .join(",\n");
}

function copiar(regla) {
  const decls = [];
  regla.walkDecls((d) => {
    if (usaColores(d.value)) decls.push(`  ${d.prop}: ${pintar(d.value)}${d.important ? " !important" : ""};`);
  });
  if (!decls.length) return "";
  if (regla.selector.includes("@keyframes")) return "";
  return `${prefijar(regla.selector)} {\n${decls.join("\n")}\n}\n`;
}

const salida = [];
raiz.walkRules((r) => {
  // Solo reglas con declaraciones propias; las de dentro de @keyframes no.
  if (r.parent && r.parent.type === "atrule" && /keyframes/i.test(r.parent.name)) return;
  // La pantalla de carga del Copetin ya tiene sus colores propios.
  if (/copetin-loading|loading-copetin/.test(r.selector)) return;
  const texto = copiar(r);
  if (!texto) return;
  const padre = r.parent && r.parent.type === "atrule" && r.parent.name === "media" ? r.parent.params : null;
  salida.push(padre ? `@media ${padre} {\n${texto}}\n` : texto);
});

const bloque = `${INI}\n${salida.join("\n")}\n${FIN}\n`;
fs.writeFileSync(CSS, `${sinBloque}\n${bloque}`);
console.log("reglas copiadas:", salida.length);
