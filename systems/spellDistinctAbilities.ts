
// Each ability owns its geometry, timing, and motion. Only drawing primitives are shared.
export { buildPyroclasticSurge } from './fireSpellBuilders';

export { buildWhirlpoolVortex } from './waterSpellBuilders';

export { buildPlasmaRailgun } from './lightningSpellBuilders';

export { buildBlizzardVortex } from './iceSpellBuilders';

export { buildAeroShockwave } from './windSpellBuilders';

export { buildBoulderCatapult } from './soilSpellBuilders';

export { buildIronwoodSlam } from './treeSpellBuilders';

export { buildLuciferAscension } from './darkSpellBuilders';

export { buildSunburstLance, buildArchangelAscension } from './lightSpellBuilders';

export { buildMeteorShower, buildCosmicRay, PORTAL_DISTANCE } from './spaceSpellBuilders';

export { buildGearBarrage } from './timeSpellBuilders';

export { buildHyperBeam, buildOverclockGrid, buildMissileSalvo } from './robotSpellBuilders';

export { buildPetalBreeze } from './healingSpellBuilders';

export { buildVoidScissors as buildDimensionalSlash, buildVoidBreach as buildVoidCollapse } from './voidSpellBuilders';
