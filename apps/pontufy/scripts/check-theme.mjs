// Guarda do tema: reprova classes que já causaram regressão de contraste ou de
// tamanho de texto (auditoria de design, Fase 2). Roda no build e no CI.
//
// Cada regra tem a troca correta na mensagem. Para texto, os papéis são:
//   text-md-on-surface         texto principal
//   text-md-on-surface-variant texto secundário (7,30:1)
//   text-md-on-surface-muted   metadados (6,07:1)
//   text-md-primary-text       links e destaques na cor da marca (8,19:1)
// md-primary (#5c4152) e md-primary-container (#b4585d) são preenchimentos.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const V = String.raw`(?<![\w-])(?:[\w-]+:)*`; // prefixos de variante (hover:, md:, disabled:...)

const RULES = [
  {
    re: new RegExp(V + String.raw`(?:text|placeholder)-gray-[5-7]00(?![\w-])`, 'g'),
    msg: 'cinza abaixo de 4,5:1 no fundo escuro; use text-md-on-surface-muted ou text-md-on-surface-variant',
  },
  {
    re: /emerald-\d/g,
    msg: 'esmeralda não faz parte da paleta; ação → md-primary, pontos/sucesso → md-tertiary, alerta → md-highlight, erro → md-error',
  },
  {
    re: new RegExp(V + String.raw`text-md-primary(?:-container)?(?:\/\d+)?(?![\w-])`, 'g'),
    msg: 'md-primary/md-primary-container como texto fica entre 2:1 e 3,9:1; use text-md-primary-text',
  },
  {
    re: new RegExp(V + String.raw`text-md-on-surface-variant\/\d+(?![\w-])`, 'g'),
    msg: 'opacidade em texto derruba o contraste; use text-md-on-surface-muted',
  },
  {
    re: /text-\[(?:\d|1[01])(?:\.\d+)?px\]/g,
    msg: 'texto abaixo de 12px; o piso é text-xs (12px)',
  },
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(tsx?|css)$/.test(name)) yield path;
  }
}

let failures = 0;
for (const file of walk(SRC)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const { re, msg } of RULES) {
      for (const m of line.matchAll(re)) {
        failures++;
        console.error(`${relative(ROOT, file)}:${i + 1}  ${m[0]}  → ${msg}`);
      }
    }
  });
}

if (failures) {
  console.error(`\ncheck-theme: ${failures} uso(s) fora do tema. Veja "Tema Visual" em CLAUDE.md.`);
  process.exit(1);
}
console.log('check-theme: ok');
