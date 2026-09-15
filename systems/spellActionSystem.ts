import type { ElementalSpell, SpellAction } from '../data/elementalSpells';
import type { StickManEntity } from './stickManPopulation';

interface Position { x: number; y: number }

export type SpellStatus =
  | 'shielded' | 'shieldImpact' | 'recovering' | 'stunned' | 'frozen'
  | 'rooted' | 'slowed' | 'stasis' | 'silenced';

export type SpellPoseKind =
  | 'projectile' | 'heavy' | 'defend' | 'heal' | 'summon' | 'channel'
  | 'teleport' | 'levitate' | 'rewind' | 'stunned' | 'frozen'
  | 'rooted' | 'shieldImpact' | 'recovering';

interface StatusState { kind: SpellStatus; remaining: number; duration: number }
interface Action {
  spell: ElementalSpell;
  caster: StickManEntity;
  elapsed: number;
  start: Position;
  end: Position;
  path: Position[];
  affected: string[];
  affectedStarts: Map<string, Position>;
  applied: boolean;
  width: number;
  height: number;
  center: Position;
}

export interface SpellPose {
  lift: number;
  scale: number;
  hidden: boolean;
  paused: boolean;
  kind?: SpellPoseKind;
  progress?: number;
  shielded?: boolean;
  speedMultiplier?: number;
  casting?: boolean;
}

const smooth = (n: number) => {
  const p = Math.max(0, Math.min(1, n));
  return p * p * (3 - 2 * p);
};
const NEGATIVE_STATUSES = new Set<SpellStatus>(['stunned', 'frozen', 'rooted', 'slowed', 'stasis', 'silenced']);
const STATUS_FOR_ACTION: Partial<Record<SpellAction, SpellStatus>> = {
  stun: 'stunned', freeze: 'frozen', root: 'rooted', slow: 'slowed',
  stasis: 'stasis', silence: 'silenced',
};
const POSE_FOR_STATUS: Partial<Record<SpellStatus, SpellPoseKind>> = {
  stunned: 'stunned', frozen: 'frozen', rooted: 'rooted', stasis: 'frozen',
  shieldImpact: 'shieldImpact', recovering: 'recovering',
};

/** Owns spell movement and temporary character state; visual builders remain independent. */
export class SpellActionSystem {
  private actions = new Map<string, Action>();
  private history = new Map<string, Position[]>();
  private statuses = new Map<string, Map<SpellStatus, StatusState>>();
  private sampleTime = 0;
  private poses = new Map<string, SpellPose>();

  cast(spell: ElementalSpell, caster: StickManEntity, companions: StickManEntity[], width: number, height: number) {
    const distance = Math.min(190, width * 0.32 / 1.45);
    if (this.hasStatus(caster.id, 'silenced')) return 0;
    const start = { x: caster.docX, y: caster.docY };
    const path = [...(this.history.get(caster.id) || [start])].reverse();
    const scale = Math.max(0.8, Math.min(1.25, caster.scaleVariant)) * 1.45;
    const dxPercent = Math.sin(caster.headingAngle) * distance * scale / width * 100;
    const dyPercent = -Math.cos(caster.headingAngle) * distance * scale / height * 100;
    const center = { x: this.clampX(start.x + dxPercent * 0.72), y: this.clampY(start.y + dyPercent * 0.72) };
    let end = start;
    if (spell.action === 'teleport' || spell.action === 'levitate' || spell.action === 'cloak') {
      const multiplier = spell.action === 'teleport' ? 1 : spell.action === 'levitate' ? 0.48 : 0.22;
      end = { x: this.clampX(start.x + dxPercent * multiplier), y: this.clampY(start.y + dyPercent * multiplier) };
    }
    const affected = this.selectTargets(spell, caster, companions, width, height, center);
    const affectedStarts = new Map<string, Position>();
    for (const id of affected) {
      const target = companions.find(entity => entity.id === id);
      if (target) affectedStarts.set(id, { x: target.docX, y: target.docY });
    }
    this.actions.set(caster.id, {
      spell, caster, elapsed: 0, start, end, path, affected, affectedStarts,
      applied: false, width, height, center,
    });
    return distance;
  }

  update(delta: number, companions: StickManEntity[]) {
    this.poses.clear();
    this.updateStatuses(delta);
    this.sampleHistory(delta, companions);
    for (const [id, action] of this.actions) {
      action.elapsed += delta;
      const p = Math.min(1, action.elapsed / action.spell.duration);
      const pose: SpellPose = {
        lift: 0, scale: 1, hidden: false, paused: true,
        kind: this.poseForSpell(action.spell), progress: p, casting: true,
      };
      this.updateCasterMovement(action, pose, p);
      if (!action.applied && p >= 0.24) {
        this.applyOutcome(action);
        action.applied = true;
      }
      if (action.spell.action === 'pull' || action.spell.action === 'push') this.updateDisplacement(action, companions, p);
      if (p >= 1) this.actions.delete(id);
      else this.mergePose(id, pose);
    }
    this.applyStatusPoses();
  }

  pose(id: string): SpellPose | undefined { return this.poses.get(id); }
  isSilenced(id: string) { return this.hasStatus(id, 'silenced'); }
  isShielded(id: string) { return this.hasStatus(id, 'shielded'); }
  isImmobilized(id: string) {
    return ['stunned', 'frozen', 'rooted', 'stasis'].some(status => this.hasStatus(id, status as SpellStatus));
  }

  /** Lets scripted encounters consume an active ward before applying recoil. */
  resolveImpact(targetId: string) {
    if (this.hasStatus(targetId, 'shielded')) {
      this.removeStatus(targetId, 'shielded');
      this.addStatus(targetId, 'shieldImpact', 0.55);
      return true;
    }
    this.addStatus(targetId, 'stunned', 0.45);
    return false;
  }

  dispose() {
    this.actions.clear();
    this.history.clear();
    this.statuses.clear();
    this.poses.clear();
  }

  private sampleHistory(delta: number, companions: StickManEntity[]) {
    this.sampleTime += delta;
    if (this.sampleTime < 0.1) return;
    this.sampleTime = 0;
    for (const entity of companions) {
      if (this.actions.has(entity.id)) continue;
      const path = this.history.get(entity.id) || [];
      path.push({ x: entity.docX, y: entity.docY });
      if (path.length > 28) path.shift();
      this.history.set(entity.id, path);
    }
  }

  private selectTargets(spell: ElementalSpell, caster: StickManEntity, companions: StickManEntity[], width: number, height: number, center: Position) {
    if (spell.target === 'self') return [caster.id];
    const others = companions.filter(entity => entity.id !== caster.id);
    const distanceFrom = (entity: StickManEntity, point: Position) => Math.hypot(
      (entity.docX - point.x) * width / 100,
      (entity.docY - point.y) * height / 100
    );
    if (spell.target === 'allies') {
      const radius = spell.radius || 170;
      return [caster.id, ...others.filter(entity => distanceFrom(entity, { x: caster.docX, y: caster.docY }) <= radius).map(entity => entity.id)];
    }
    if (spell.target === 'nearest') {
      const casterPosition = { x: caster.docX, y: caster.docY };
      const nearest = others.sort((a, b) => distanceFrom(a, casterPosition) - distanceFrom(b, casterPosition))[0];
      return nearest && distanceFrom(nearest, casterPosition) <= (spell.radius || 230) ? [nearest.id] : [];
    }
    const radius = spell.radius || (spell.target === 'area' ? 150 : 105);
    const candidates = others.map(entity => ({ entity, distance: distanceFrom(entity, center) }))
      .filter(item => item.distance <= radius).sort((a, b) => a.distance - b.distance);
    return spell.target === 'ahead' ? candidates.slice(0, 1).map(item => item.entity.id) : candidates.map(item => item.entity.id);
  }

  private updateCasterMovement(action: Action, pose: SpellPose, p: number) {
    const entity = action.caster;
    if (action.spell.action === 'teleport') {
      pose.kind = 'teleport';
      pose.scale = action.elapsed < 0.45 ? 1 - smooth((action.elapsed - 0.25) / 0.2) : smooth((action.elapsed - 0.82) / 0.22);
      pose.hidden = action.elapsed >= 0.45 && action.elapsed < 0.82;
      this.move(entity, action.elapsed < 0.65 ? action.start : action.end);
    } else if (action.spell.action === 'levitate') {
      pose.kind = 'levitate';
      pose.lift = Math.sin(p * Math.PI) * 55;
      this.move(entity, this.lerpPosition(action.start, action.end, smooth((p - 0.18) / 0.64)));
    } else if (action.spell.action === 'cloak') {
      pose.hidden = p > 0.24 && p < 0.76;
      this.move(entity, this.lerpPosition(action.start, action.end, smooth((p - 0.22) / 0.56)));
    } else if (action.spell.action === 'rewind') {
      pose.kind = 'rewind';
      const index = smooth(p) * Math.max(0, action.path.length - 1);
      const low = Math.floor(index);
      const a = action.path[low] || action.start;
      const b = action.path[Math.min(low + 1, action.path.length - 1)] || a;
      this.move(entity, this.lerpPosition(a, b, index - low));
    }
  }

  private applyOutcome(action: Action) {
    const spellAction = action.spell.action;
    if (spellAction === 'shield') {
      this.addStatus(action.caster.id, 'shielded', action.spell.statusDuration || 5);
      return;
    }
    if (spellAction === 'restore' || spellAction === 'cleanse') {
      for (const id of action.affected) {
        this.cleanse(id);
        this.addStatus(id, 'recovering', 0.9);
      }
      return;
    }
    if (spellAction === 'summon') {
      if (action.spell.element === 'time') this.addStatus(action.caster.id, 'shielded', 3.5);
      if (action.spell.element === 'dark') for (const id of action.affected) this.applyHarmfulStatus(id, 'slowed', 1.8);
      if (action.spell.element === 'fire') for (const id of action.affected) this.applyHarmfulStatus(id, 'stunned', 0.5);
      return;
    }
    if (spellAction === 'damageReaction') {
      for (const id of action.affected) this.applyHarmfulStatus(id, 'stunned', 0.45);
      return;
    }
    const status = STATUS_FOR_ACTION[spellAction];
    if (status) for (const id of action.affected) this.applyHarmfulStatus(id, status, action.spell.statusDuration || action.spell.duration * 0.72);
  }

  private updateDisplacement(action: Action, companions: StickManEntity[], p: number) {
    const movement = smooth((p - 0.24) / 0.5);
    if (movement <= 0) return;
    for (const id of action.affected) {
      const target = companions.find(entity => entity.id === id);
      const start = action.affectedStarts.get(id);
      if (!target || !start || this.hasStatus(id, 'shielded')) continue;
      const vx = start.x - action.center.x;
      const vy = start.y - action.center.y;
      const length = Math.max(0.001, Math.hypot(vx * action.width / 100, vy * action.height / 100));
      const direction = action.spell.action === 'pull' ? -1 : 1;
      const pixels = (action.spell.element === 'wind' ? 42 : 28) * movement * direction;
      this.move(target, {
        x: start.x + (vx * action.width / 100 / length) * pixels / action.width * 100,
        y: start.y + (vy * action.height / 100 / length) * pixels / action.height * 100,
      });
    }
  }

  private updateStatuses(delta: number) {
    for (const [id, statuses] of this.statuses) {
      for (const [kind, status] of statuses) {
        status.remaining -= delta;
        if (status.remaining <= 0) statuses.delete(kind);
      }
      if (statuses.size === 0) this.statuses.delete(id);
    }
  }

  private applyStatusPoses() {
    for (const [id, statuses] of this.statuses) {
      let strongest: StatusState | undefined;
      for (const status of statuses.values()) {
        if (!strongest || this.statusPriority(status.kind) > this.statusPriority(strongest.kind)) strongest = status;
      }
      if (!strongest) continue;
      const progress = 1 - strongest.remaining / strongest.duration;
      const immobilized = ['stunned', 'frozen', 'rooted', 'stasis'].includes(strongest.kind);
      this.mergePose(id, {
        lift: strongest.kind === 'stunned' ? Math.abs(Math.sin(progress * Math.PI * 5)) * 4 : 0,
        scale: strongest.kind === 'recovering' ? 1 + Math.sin(progress * Math.PI) * 0.08 : 1,
        hidden: false,
        paused: immobilized,
        kind: POSE_FOR_STATUS[strongest.kind],
        progress,
        shielded: statuses.has('shielded'),
        speedMultiplier: statuses.has('slowed') ? 0.38 : 1,
      });
    }
  }

  private poseForSpell(spell: ElementalSpell): SpellPoseKind {
    if (spell.action === 'teleport') return 'teleport';
    if (spell.action === 'levitate') return 'levitate';
    if (spell.action === 'rewind') return 'rewind';
    if (spell.castType === 'shield') return 'defend';
    if (spell.castType === 'restore') return 'heal';
    if (spell.castType === 'summon') return 'summon';
    if (spell.castType === 'control') return 'channel';
    return spell.id.includes('meteor') ? 'heavy' : 'projectile';
  }

  private applyHarmfulStatus(id: string, status: SpellStatus, duration: number) {
    if (this.hasStatus(id, 'shielded')) {
      this.removeStatus(id, 'shielded');
      this.addStatus(id, 'shieldImpact', 0.55);
      return;
    }
    this.addStatus(id, status, duration);
  }

  private addStatus(id: string, kind: SpellStatus, duration: number) {
    const statuses = this.statuses.get(id) || new Map<SpellStatus, StatusState>();
    statuses.set(kind, { kind, duration, remaining: duration });
    this.statuses.set(id, statuses);
  }

  private cleanse(id: string) {
    const statuses = this.statuses.get(id);
    if (!statuses) return;
    for (const kind of NEGATIVE_STATUSES) statuses.delete(kind);
    if (statuses.size === 0) this.statuses.delete(id);
  }

  private removeStatus(id: string, kind: SpellStatus) {
    const statuses = this.statuses.get(id);
    statuses?.delete(kind);
    if (statuses?.size === 0) this.statuses.delete(id);
  }

  private hasStatus(id: string, kind: SpellStatus) { return this.statuses.get(id)?.has(kind) || false; }
  private mergePose(id: string, incoming: SpellPose) {
    const current = this.poses.get(id);
    if (!current) { this.poses.set(id, incoming); return; }
    this.poses.set(id, {
      lift: Math.max(current.lift, incoming.lift), scale: current.scale * incoming.scale,
      hidden: current.hidden || incoming.hidden, paused: current.paused || incoming.paused,
      kind: incoming.kind || current.kind, progress: incoming.progress ?? current.progress,
      shielded: current.shielded || incoming.shielded,
      speedMultiplier: Math.min(current.speedMultiplier ?? 1, incoming.speedMultiplier ?? 1),
      casting: current.casting || incoming.casting,
    });
  }
  private statusPriority(kind: SpellStatus) {
    return ['shielded', 'silenced', 'slowed', 'recovering', 'rooted', 'stunned', 'frozen', 'stasis', 'shieldImpact'].indexOf(kind);
  }
  private move(entity: StickManEntity, position: Position) {
    entity.docX = entity.targetDocX = this.clampX(position.x);
    entity.docY = entity.targetDocY = this.clampY(position.y);
  }
  private lerpPosition(a: Position, b: Position, p: number): Position { return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p }; }
  private clampX(value: number) { return Math.max(5, Math.min(95, value)); }
  private clampY(value: number) { return Math.max(1, Math.min(99, value)); }
}
