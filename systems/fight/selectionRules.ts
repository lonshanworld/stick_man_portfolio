export interface PendingFightCandidate<T extends { id: string }> {
  entity: T;
  startedAt: number;
  expiresAt: number;
}

export type FightSelectionDecision<T extends { id: string }> =
  | { type: 'start-window'; pending: PendingFightCandidate<T> }
  | { type: 'too-early' | 'same-fighter'; pending: PendingFightCandidate<T> }
  | { type: 'match'; first: T; second: T };

export function resolveFightSelection<T extends { id: string }>(
  pending: PendingFightCandidate<T> | null,
  selected: T,
  selectedAt: number,
): FightSelectionDecision<T> {
  if (!pending || selectedAt > pending.expiresAt) {
    return {
      type: 'start-window',
      pending: { entity: selected, startedAt: selectedAt, expiresAt: selectedAt + 5000 },
    };
  }
  if (pending.entity.id === selected.id) return { type: 'same-fighter', pending };
  if (selectedAt - pending.startedAt < 1000) return { type: 'too-early', pending };
  return { type: 'match', first: pending.entity, second: selected };
}
