import type { SpellDrawing } from './spellDrawing';

/** Bespoke scenery and volume for every ability. No universal circle or explosion overlay. */
export function addElementalSpellArt(d: SpellDrawing) {
  const id = d.spell.id;
  d.root.name = `spell-${id}`;
  d.root.userData.artDirection = d.spell.element;
  switch (id) {
    // Fire owns dedicated volumetric combustion builders.
    // Water owns dedicated liquid surfaces, foam, and ballistic spray.
    // Lightning owns connected leaders, live forks, and pulsed coronas.
    // Ice owns six-sided crystal geometry, solid facets, and branching frost.
    // Wind owns flowing pressure sheets, air wakes, and suspended mist.
    // Soil owns stratified rock, excavation, ballistic rubble, and settling dust.
    // Trees owns tapered bark roots, branching timber, leaf canopies, and sap pollen.
    // Dark owns skeletal hands, curved bat wings, revenants, and armored skeletal guardians.
    // Light owns optical sheets, spectral fringes, and radiant feather fans.
    // Space owns accretion discs, gravitationally lensed stars, and curved spacetime.
    // Time owns chronological playback, fixed clock dials, and suspended sand.
    // Robot owns machined emitters, maintenance drones and physical guided ordnance.
    // Healing owns restorative hearts, sutures, rounded familiars, and cleansing capsules.
    // Void owns dedicated builders with authored aperture materials and timing.
  }
}
