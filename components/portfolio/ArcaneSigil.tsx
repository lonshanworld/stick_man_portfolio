import type { ElementType } from '../../types';

// Each element has an authored glyph and its own surrounding geometry.
const SEALS: Record<ElementType, { points: number; step: number; dash: string; glyph: string; motif: string }> = {
  fire: { points: 3, step: 1, dash: '18 5', glyph: 'M200 158c9 25-15 26-5 44 7-3 10-13 12-21 21 23 26 50 2 59-37 14-56-23-35-48-2 19 7 20 9 16-5-21 15-29 17-50Z', motif: 'M200 47l-9 20h18Z' },
  water: { points: 8, step: 3, dash: '40 12', glyph: 'M200 158s-30 36-30 57a30 30 0 0 0 60 0c0-21-30-57-30-57ZM184 219c0 10 7 16 16 16M163 252h74', motif: 'M190 58q5-10 10 0t10 0' },
  lightning: { points: 6, step: 2, dash: '2 8 20 8', glyph: 'M207 156l-35 48h27l-8 40 38-53h-28Z', motif: 'M205 46l-10 12h10l-10 12' },
  ice: { points: 6, step: 1, dash: '1 9', glyph: 'M200 156v88M162 178l76 44M162 222l76-44M190 166l10 10 10-10M190 234l10-10 10 10M166 190l14-4-4-14M224 228l-4-14 14-4M176 228l4-14-14-4M234 190l-14-4 4-14', motif: 'M200 46l8 12-8 12-8-12Z' },
  wind: { points: 5, step: 2, dash: '55 18', glyph: 'M157 185h59c25 0 25-30 8-30-10 0-14 7-14 12M150 202h82c23 0 23 31 5 31-9 0-13-7-13-12M163 219h32c20 0 20 26 5 26', motif: 'M190 63q20 0 20-12q-8-8-12 0' },
  soil: { points: 4, step: 1, dash: '12 6', glyph: 'M156 232l20-40 16 14 22-45 31 71ZM176 192l8 40M214 161l-5 71M160 244h80', motif: 'M190 66l6-16h8l6 16Z' },
  trees: { points: 7, step: 2, dash: '8 4 2 4', glyph: 'M200 243v-66M200 210l-23-24M200 222l26-24M200 184c-25 1-35-22-31-32 21 0 35 10 31 32ZM200 206c-1-27 20-36 33-33 0 20-14 34-33 33ZM182 247l18-15 18 15', motif: 'M200 68c-18-8-12-20 0-22 12 2 18 14 0 22Z' },
  dark: { points: 8, step: 2, dash: '3 5', glyph: 'M174 213c-20-41 5-60 26-60s46 19 26 60l-8 6v18h-36v-18ZM180 191l13 9-13 5ZM220 191l-13 9 13 5ZM200 205l-5 10h10ZM192 225v12M208 225v12', motif: 'M200 48v20M194 54h12M196 62h8' },
  light: { points: 12, step: 5, dash: '32 12 2 12', glyph: 'M200 157l10 33 33 10-33 10-10 33-10-33-33-10 33-10ZM169 169l6 6M225 225l6 6M169 231l6-6M225 175l6-6', motif: 'M200 46l3 9 9 3-9 3-3 9-3-9-9-3 9-3Z' },
  space: { points: 9, step: 4, dash: '2 14', glyph: 'M200 180a20 20 0 1 0 0 40 20 20 0 1 0 0-40ZM157 227c-10-16 64-69 86-54 15 17-68 75-86 54ZM163 166l3 8 8 3-8 3-3 8-3-8-8-3 8-3ZM237 229l4 12M231 235h12', motif: 'M200 52a6 6 0 1 0 0 12 6 6 0 1 0 0-12Z' },
  time: { points: 12, step: 1, dash: '1 6', glyph: 'M200 158a42 42 0 1 0 0 84 42 42 0 1 0 0-84ZM200 168v8M232 200h-8M200 232v-8M168 200h8M200 181v22l17 12', motif: 'M193 48h14l-2 7-5 3 5 3 2 7h-14l2-7 5-3-5-3Z' },
  robot: { points: 4, step: 1, dash: '16 4 4 4', glyph: 'M176 176h48v48h-48ZM187 187h26v26h-26ZM184 163v13M200 163v13M216 163v13M184 224v13M200 224v13M216 224v13M163 184h13M163 200h13M163 216h13M224 184h13M224 200h13M224 216h13', motif: 'M193 48h14v20h-14ZM200 48v-5M200 68v5' },
  healing: { points: 5, step: 1, dash: '5 10', glyph: 'M187 159h26v28h28v26h-28v28h-26v-28h-28v-26h28ZM169 234q31 28 62 0', motif: 'M200 67s-17-10-10-18q7-5 10 3 3-8 10-3 7 8-10 18Z' },
  void: { points: 10, step: 3, dash: '65 7 2 7', glyph: 'M200 170a30 30 0 1 0 0 60 30 30 0 1 0 0-60ZM175 150c69-11 99 82 25 101M225 250c-69 11-99-82-25-101M200 156v14M244 200h-14M200 244v-14M156 200h14', motif: 'M200 46l7 12-7 12-7-12ZM200 53v10' },
};

function point(index: number, count: number, radius: number) {
  const angle = index * Math.PI * 2 / count - Math.PI / 2;
  // Trigonometry can differ by a few floating-point bits between Node and browsers.
  // Serialize all SVG coordinates at the same precision before hydration.
  return [(200 + Math.cos(angle) * radius).toFixed(2), (200 + Math.sin(angle) * radius).toFixed(2)];
}

function vertex(index: number, count: number, radius: number) {
  return point(index, count, radius).join(',');
}

/** Original vector seals, shared by the observatory and portfolio artwork. */
export function ArcaneSigil({ realm = 'light', className = '' }: { realm?: ElementType; className?: string }) {
  const seal = SEALS[realm];
  return (
    <svg className={`arcane-sigil ${className}`} data-seal={realm} viewBox="0 0 400 400" fill="none" aria-hidden="true">
      <g className="sigil-outer" stroke="currentColor" strokeWidth=".8">
        <circle cx="200" cy="200" r="182" /><circle cx="200" cy="200" r="174" strokeDasharray={seal.dash} strokeWidth="2" /><circle cx="200" cy="200" r="159" />
        {Array.from({ length: seal.points * 2 }, (_, i) => <g key={i} transform={`rotate(${i * 180 / seal.points} 200 200)`}><path d={seal.motif} /><path d="M200 19v12" /></g>)}
      </g>
      <g className="sigil-inner" stroke="currentColor" strokeWidth="1">
        {Array.from({ length: seal.points }, (_, i) => <path key={i} d={`M${vertex(i, seal.points, 135)}L${vertex(i + seal.step, seal.points, 135)}`} />)}
        <polygon points={Array.from({ length: seal.points }, (_, i) => vertex(i, seal.points, 110)).join(' ')} transform="rotate(15 200 200)" />
        <circle cx="200" cy="200" r="95" strokeDasharray={seal.dash} />
      </g>
      <g className="sigil-core" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="200" cy="200" r="63" strokeWidth=".6" />
        <path d={seal.glyph} />
      </g>
      <g fill="currentColor">{Array.from({ length: seal.points }, (_, i) => {
        const [cx, cy] = point(i, seal.points, 135);
        return <circle key={i} cx={cx} cy={cy} r="3" />;
      })}</g>
    </svg>
  );
}
