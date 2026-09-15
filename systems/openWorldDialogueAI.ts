import { ElementType } from '../types/index';
import { visitDialogueDeck, DialogueType } from './visitDialogueDeck';

export type DialogueSituation = 'chat' | 'duel' | 'bully' | 'sit' | 'fly' | 'float';

export interface DialogueResult {
  speaker1Line: string;
  speaker2Line?: string;
  actionNote?: string;
  isAiGenerated?: boolean;
}

/**
 * Retrieves generative AI dialogue lines for open-world characters.
 * All dialogue is pre-generated dynamically by Google Gemini AI (configured in .env)
 * once per visit and cached in session storage.
 */
export async function fetchGenerativeDialogue(params: {
  situation: DialogueSituation;
  speaker: { id: string; element: ElementType; name: string; title: string; personality: string };
  target?: { id: string; element: ElementType; name: string; title: string; personality: string };
  context?: string;
}): Promise<DialogueResult> {
  const typeMap: Record<DialogueSituation, DialogueType> = {
    chat: 'ambient',
    duel: 'duel',
    bully: 'prank',
    sit: 'sitting',
    fly: 'flight',
    float: 'float',
  };

  const deckType = typeMap[params.situation] || 'ambient';
  const speakerLine = visitDialogueDeck.getCharacterDialogue(params.speaker.id, deckType);

  let targetLine: string | undefined;
  if (params.target) {
    targetLine = visitDialogueDeck.getCharacterDialogue(params.target.id, deckType);
  }

  const actionNotes: Record<DialogueSituation, string> = {
    duel: '⚔️ Spell Clash',
    bully: '😏 Playful Prank',
    sit: `🪑 Perched on ${params.context || 'Ledge'}`,
    fly: '🍃 Soaring Skywards!',
    float: '🌌 Zero-G Levitation',
    chat: '✦ Casual Encounter',
  };

  return {
    speaker1Line: speakerLine,
    speaker2Line: targetLine,
    actionNote: actionNotes[params.situation] || '✦ Open-World Explorer',
    isAiGenerated: true,
  };
}

/**
 * Procedural fallback alias that delegates directly to visitDialogueDeck
 */
export function getProceduralDialogue(
  element: ElementType,
  situation: DialogueSituation,
  targetElement?: ElementType
): DialogueResult {
  return {
    speaker1Line: visitDialogueDeck.getCharacterDialogue(`${element}-hero`, situation === 'chat' ? 'ambient' : (situation as DialogueType)),
    speaker2Line: targetElement ? visitDialogueDeck.getCharacterDialogue(`${targetElement}-hero`, situation === 'chat' ? 'ambient' : (situation as DialogueType)) : undefined,
    actionNote: situation === 'duel' ? '⚔️ Magic Clash' : situation === 'bully' ? '😏 Prank!' : '✦ Greeting',
    isAiGenerated: true,
  };
}
