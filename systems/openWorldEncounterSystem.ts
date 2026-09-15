import { DialogueMessage, StickManEntity } from './stickManPopulation';
import { cardLedgeSystem } from './cardLedgeSystem';
import { fetchGenerativeDialogue } from './openWorldDialogueAI';
import { visitDialogueDeck } from './visitDialogueDeck';
import { STICK_MAN_ARCHETYPES } from '../data/stickManArchetypes';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { soundEngine } from './soundEngine';
import type { SpellEffectSystem } from './spellEffectSystem';
import type { SpellActionSystem } from './spellActionSystem';
import type { StickMan3DCharacter } from '../types';

// Autonomous combat encounters are paused; the player-vs-AI arena is launched manually.
const COMBAT_ENCOUNTERS_ENABLED = false;
const CONVERSATION_START_DISTANCE = 18;
const CONVERSATION_MEETING_DISTANCE = 6.5;
const CONVERSATION_GAP = 3.4;
const VIEWPORT_MARGIN = 160;

interface ActiveConversation {
  id: string;
  firstId: string;
  secondId: string;
  lines: DialogueMessage[];
  turnIndex: number;
  turnRemaining: number;
  pauseRemaining: number;
}

export class OpenWorldEncounterSystem {
  private lastEvaluationTime: number = 0;
  private lastWindFlightTime: number = performance.now() - 15000; // Throttle wind flight to at most once per 30s
  private activeSpeakerId: string | null = null;
  private speechCooldownUntil: number = 0;
  private sessionInitialized: boolean = false;
  private activeDuelChallengerId: string | null = null;
  private lastDuelEndTime: number = 0;
  private activeConversation: ActiveConversation | null = null;
  private conversationLoadingId: string | null = null;
  private conversationApproaching = false;
  private conversationSequence = 0;

  /**
   * Checks if a magic spell fight/duel is currently active or being approached.
   * Strictly enforces: Only ONE fight can happen at any time across the entire website.
   */
  public isFightActive(entities?: StickManEntity[]): boolean {
    if (!COMBAT_ENCOUNTERS_ENABLED) return false;
    if (this.activeDuelChallengerId !== null) return true;
    if (entities) {
      return entities.some(
        (e) => e.state === 'dueling' || e.encounterState === 'approaching_duel'
      );
    }
    return false;
  }

  /**
   * Only one stick man speaks at a time, followed by silent breathing room
   * so characters don't all speak at once.
   */
  private canSpeak(now: number): boolean {
    return now >= this.speechCooldownUntil && this.activeSpeakerId === null;
  }

  private canStartConversation(now: number): boolean {
    return !this.activeConversation && !this.conversationLoadingId && !this.conversationApproaching && this.canSpeak(now);
  }

  private canStartIndividualSpeech(now: number): boolean {
    return !this.activeConversation && !this.conversationLoadingId && !this.conversationApproaching && this.canSpeak(now);
  }

  private isInViewport(
    entity: StickManEntity,
    winHeight: number,
    docHeight: number,
    scrollY: number
  ): boolean {
    const screenY = (entity.docY / 100) * docHeight - scrollY;
    return screenY >= -VIEWPORT_MARGIN && screenY <= winHeight + VIEWPORT_MARGIN;
  }

  /**
   * Claims exclusive speech slot for an entity with automatic release and inter-dialogue silence
   */
  private claimSpeech(
    entity: StickManEntity,
    durationMs: number = 4200,
    silentCooldownMs: number = 14000
  ): void {
    if (this.activeConversation || this.conversationLoadingId || this.conversationApproaching) {
      entity.isSpeaking = false;
      entity.activeDialogue = undefined;
      return;
    }
    const now = performance.now();
    this.activeSpeakerId = entity.id;
    entity.isSpeaking = true;
    this.speechCooldownUntil = now + durationMs + silentCooldownMs;

    setTimeout(() => {
      entity.isSpeaking = false;
      entity.activeDialogue = undefined;
      if (this.activeSpeakerId === entity.id) {
        this.activeSpeakerId = null;
      }
    }, durationMs);
  }

  /**
   * Evaluates autonomous open-world behaviors for all entities
   */
  public update(
    deltaSec: number,
    entities: StickManEntity[],
    spellSystem: SpellEffectSystem | null,
    winWidth: number,
    winHeight: number,
    docHeight: number,
    scrollY: number,
    char3DMap?: Map<string, StickMan3DCharacter>,
    spellActions?: SpellActionSystem
  ): void {
    const now = performance.now();

    // Initialize visit dialogue deck once per browser visit
    if (!this.sessionInitialized && typeof window !== 'undefined') {
      this.sessionInitialized = true;
      visitDialogueDeck.initSession();
    }

    // Run high-level state decisions every ~1.2 seconds
    const shouldEvaluate = now - this.lastEvaluationTime > 1200;
    if (shouldEvaluate) {
      this.lastEvaluationTime = now;
      this.evaluateAutonomousBehaviors(entities, winHeight, docHeight, scrollY);
    }

    // Advance the active conversation before other encounter state so the
    // visible speaker changes on a predictable turn boundary.
    this.updateActiveConversation(deltaSec, entities);

    // Advance active encounters frame-by-frame
    entities.forEach((entity) => {
      this.updateEntityEncounterState(
        entity,
        deltaSec,
        entities,
        spellSystem,
        winWidth,
        winHeight,
        docHeight,
        scrollY,
        char3DMap,
        spellActions
      );
    });
  }

  /**
   * Periodically chooses calm open-world goals for idle entities.
   * Autonomous combat and bullying stay paused while calm conversations continue.
   */
  private evaluateAutonomousBehaviors(
    entities: StickManEntity[],
    winHeight: number,
    docHeight: number,
    scrollY: number
  ): void {
    const now = performance.now();
    const canFlyWind = (now - this.lastWindFlightTime) >= 30000;

    entities.forEach((entity) => {
      // Only assign new high-level actions if idle and not currently in an encounter
      if (
        entity.state !== 'idle' ||
        entity.encounterState ||
        entity.duelPartnerId ||
        entity.bullyPartnerId ||
        (entity.encounterTimer && entity.encounterTimer > 0)
      ) {
        return;
      }

      const roll = Math.random();
      const nearbyPartner = this.findAvailablePartner(entity, entities);

      // Make social behavior easy to notice: two nearby companions talk
      // instead of silently passing one another.
      if (
        nearbyPartner &&
        this.isInViewport(entity, winHeight, docHeight, scrollY) &&
        this.isInViewport(nearbyPartner, winHeight, docHeight, scrollY) &&
        Math.hypot(nearbyPartner.docX - entity.docX, nearbyPartner.docY - entity.docY) < CONVERSATION_START_DISTANCE &&
        this.canStartConversation(now)
      ) {
        this.startApproachingChat(entity, nearbyPartner);
        return;
      }

      // ── 1. Wind Flying Behavior (Only for wind elements, strictly once per 30s) ──
      if (entity.element === 'wind' && canFlyWind && roll < 0.35) {
        this.lastWindFlightTime = now;
        this.startWindFlight(entity);
        return;
      }

      // ── 2. Floating / Levitation Behavior (Space, Void, Light, Time) ──
      if (
        (entity.element === 'space' ||
          entity.element === 'void' ||
          entity.element === 'light' ||
          entity.element === 'time') &&
        roll < 0.25
      ) {
        this.startFloating(entity);
        return;
      }

      // ── 3. Interactive Encounters: Spell Duel or Bully Prank ──
      const actionPick = Math.random();

      // 30% chance: Spell Duel Challenge (strictly only ONE fight per time, and ONLY if in user's view)
      // 34% chance: Playful Sneaky Bully Prank
      if (COMBAT_ENCOUNTERS_ENABLED && actionPick < 0.64) {
        const victim = this.findAvailablePartner(entity, entities);
        if (victim) {
          this.startApproachingBully(entity, victim);
          return;
        }
      }
      // 18% chance: Portfolio Card Ledge Sitting
      else if (actionPick < 0.90) {
        const perch = cardLedgeSystem.findNearestPerch(
          entity.docX,
          entity.docY,
          entity.homeDistrict,
          entity.id
        );
        if (perch) {
          entity.perchId = perch.id;
          entity.perchCardName = perch.cardName;
          entity.perchSide = perch.side;
          entity.targetDocX = perch.docX;
          entity.targetDocY = perch.docY;
          entity.state = 'walking';
          return;
        }
      }
      // 10% chance: Casual Greeting
      else {
        const partner = this.findAvailablePartner(entity, entities);
        if (
          partner &&
          this.isInViewport(entity, winHeight, docHeight, scrollY) &&
          this.isInViewport(partner, winHeight, docHeight, scrollY) &&
          Math.hypot(partner.docX - entity.docX, partner.docY - entity.docY) < CONVERSATION_START_DISTANCE &&
          this.canStartConversation(now)
        ) {
          this.startApproachingChat(entity, partner);
          return;
        }
      }
    });
  }

  /**
   * Finds the nearest companion in the same district available for a chat.
   */
  public findAvailablePartner(
    self: StickManEntity,
    entities: StickManEntity[]
  ): StickManEntity | null {
    const candidates = entities.filter(
      (other) =>
        other.id !== self.id &&
        other.homeDistrict === self.homeDistrict &&
        (other.state === 'idle' || other.state === 'walking') &&
        !other.duelPartnerId &&
        !other.bullyPartnerId &&
        !other.dialoguePartnerId &&
        !other.encounterState &&
        !other.perchId
    );

    if (candidates.length === 0) return null;

    return candidates.sort(
      (first, second) =>
        Math.hypot(first.docX - self.docX, first.docY - self.docY) -
        Math.hypot(second.docX - self.docX, second.docY - self.docY)
    )[0];
  }

  public cancelConversation(entityId: string, entities: StickManEntity[]): void {
    const conversation = this.activeConversation;
    if (conversation && (conversation.firstId === entityId || conversation.secondId === entityId)) {
      this.finishConversation(conversation, entities);
      return;
    }

    if (this.conversationLoadingId) {
      const loadingPair = entities.filter((entity) => entity.dialogueSessionId === this.conversationLoadingId);
      if (loadingPair.some((entity) => entity.id === entityId)) {
        loadingPair.forEach((entity) => {
          entity.state = 'idle';
          entity.wanderTimer = 3.5;
          entity.dialoguePartnerId = undefined;
          entity.dialogueSessionId = undefined;
          entity.dialoguePhase = undefined;
          entity.dialogueTurn = undefined;
          entity.dialogueTotalTurns = undefined;
          entity.dialogueHistory = undefined;
          entity.dialogueNote = undefined;
          entity.isSpeaking = false;
          entity.activeDialogue = undefined;
        });
        this.conversationLoadingId = null;
      }
    }
  }

  /**
   * Begins marching towards a companion to challenge them to a spell duel.
   * Strictly enforces: Only ONE fight can happen at any time across the website.
   */
  public startApproachingDuel(initiator: StickManEntity, target: StickManEntity): boolean {
    if (!COMBAT_ENCOUNTERS_ENABLED) return false;
    if (this.activeDuelChallengerId !== null && this.activeDuelChallengerId !== initiator.id) {
      return false;
    }
    this.activeDuelChallengerId = initiator.id;
    initiator.state = 'walking';
    initiator.encounterState = 'approaching_duel';
    initiator.duelPartnerId = target.id;
    target.duelPartnerId = initiator.id;
    initiator.speed = 95; // Determined march

    const standoffX = initiator.docX < target.docX ? -3.8 : 3.8;
    initiator.targetDocX = target.docX + standoffX;
    initiator.targetDocY = target.docY;

    // Target stops to face or wait for the challenger
    if (target.state !== 'sitting' && target.state !== 'flying') {
      target.state = 'idle';
      target.wanderTimer = 10.0;
    }
    return true;
  }

  /**
   * Begins sneaking stealthily behind a companion to pull a bully prank
   */
  public startApproachingBully(prankster: StickManEntity, victim: StickManEntity): boolean {
    if (!COMBAT_ENCOUNTERS_ENABLED) return false;
    prankster.state = 'walking';
    prankster.encounterState = 'approaching_bully';
    prankster.bullyPartnerId = victim.id;
    victim.bullyPartnerId = prankster.id;
    prankster.speed = 52; // Stealth tiptoe stride

    const sneakX = victim.headingAngle > 0 ? -2.2 : 2.2;
    prankster.targetDocX = victim.docX + sneakX;
    prankster.targetDocY = victim.docY;

    if (victim.state !== 'sitting' && victim.state !== 'flying') {
      victim.wanderTimer = 8.0;
    }
    return true;
  }

  /**
   * Showdown: Starts the actual magic spell duel when characters are in face-to-face standoff
   */
  private startDuelShowdown(initiator: StickManEntity, target: StickManEntity): void {
    this.activeDuelChallengerId = initiator.id;
    initiator.state = 'dueling';
    target.state = 'dueling';
    initiator.encounterState = undefined;
    target.encounterState = undefined;
    initiator.duelPartnerId = target.id;
    target.duelPartnerId = initiator.id;
    initiator.duelRole = 'challenger';
    target.duelRole = 'defender';
    initiator.duelPhase = 'challenge';
    target.duelPhase = 'challenge';
    initiator.encounterTimer = 7.0;
    target.encounterTimer = 7.0;

    // Turn to directly face each other
    const dx = target.docX - initiator.docX;
    const dy = target.docY - initiator.docY;
    initiator.headingAngle = Math.atan2(dx, -dy);
    target.headingAngle = Math.atan2(-dx, dy);

    soundEngine.playSpiritClick(initiator.element);

    const now = performance.now();
    if (this.canStartIndividualSpeech(now)) {
      const initDef = STICK_MAN_ARCHETYPES[initiator.element];
      const targDef = STICK_MAN_ARCHETYPES[target.element];

      fetchGenerativeDialogue({
        situation: 'duel',
        speaker: {
          id: initiator.id,
          element: initiator.element,
          name: initiator.name,
          title: initiator.title,
          personality: initDef?.personality || 'Fierce competitor',
        },
        target: {
          id: target.id,
          element: target.element,
          name: target.name,
          title: target.title,
          personality: targDef?.personality || 'Resolute defender',
        },
        context: initiator.districtName,
      }).then((res) => {
        initiator.activeDialogue = res.speaker1Line;
        initiator.dialogueNote = res.actionNote || '⚔️ Duel Challenge';
        this.claimSpeech(initiator, 4200, 12000);
      });
    }
  }

  /**
   * Showdown: Starts the sneaky prank jump and startled reaction
   */
  private startBullyPrankShowdown(prankster: StickManEntity, victim: StickManEntity): void {
    prankster.state = 'bullying';
    victim.state = 'bullying';
    prankster.encounterState = undefined;
    victim.encounterState = undefined;
    prankster.bullyPartnerId = victim.id;
    victim.bullyPartnerId = prankster.id;
    prankster.bullyPhase = 'sneak';
    victim.bullyPhase = 'sneak';
    prankster.encounterTimer = 4.5;
    victim.encounterTimer = 4.5;

    // Turn prankster towards victim
    const dx = victim.docX - prankster.docX;
    const dy = victim.docY - prankster.docY;
    prankster.headingAngle = Math.atan2(dx, -dy);

    soundEngine.playFootstep();

    const now = performance.now();
    if (this.canStartIndividualSpeech(now)) {
      const prankDef = STICK_MAN_ARCHETYPES[prankster.element];
      const victDef = STICK_MAN_ARCHETYPES[victim.element];

      fetchGenerativeDialogue({
        situation: 'bully',
        speaker: {
          id: prankster.id,
          element: prankster.element,
          name: prankster.name,
          title: prankster.title,
          personality: prankDef?.personality || 'Cheeky prankster',
        },
        target: {
          id: victim.id,
          element: victim.element,
          name: victim.name,
          title: victim.title,
          personality: victDef?.personality || 'Focused defender',
        },
        context: prankster.districtName,
      }).then((res) => {
        prankster.activeDialogue = res.speaker1Line;
        prankster.dialogueNote = res.actionNote || '😏 Prank!';
        this.claimSpeech(prankster, 3600, 12000);
      });
    }
  }

  /**
   * Manual trigger: Launches a duel on demand with a companion in the same district.
   * Strictly enforces: Only ONE fight can happen at any time across the website.
   */
  public triggerManualDuel(charId: string, entities: StickManEntity[]): boolean {
    if (!COMBAT_ENCOUNTERS_ENABLED) return false;
    if (this.isFightActive(entities)) {
      return false;
    }
    const self = entities.find((e) => e.id === charId);
    if (!self) return false;
    const partner = this.findAvailablePartner(self, entities);
    if (!partner) return false;
    return this.startApproachingDuel(self, partner);
  }

  /**
   * Manual trigger: Launches a sneaky bully prank on demand with a companion in the same district
   */
  public triggerManualBully(charId: string, entities: StickManEntity[]): boolean {
    if (!COMBAT_ENCOUNTERS_ENABLED) return false;
    const self = entities.find((e) => e.id === charId);
    if (!self) return false;
    const partner = this.findAvailablePartner(self, entities);
    if (!partner) return false;
    this.startApproachingBully(self, partner);
    return true;
  }

  /**
   * Starts a Wind Flight soaring sequence
   */
  private startWindFlight(entity: StickManEntity): void {
    entity.state = 'flying';
    entity.flightPhase = 'takeoff';
    entity.flightAltitude = 0;
    entity.encounterTimer = 6.0; // 6 seconds of flying
    entity.speed = 240; // Fast flight stride

    // Target a distant point across the site
    const destX = Math.random() > 0.5 ? 85 : 15;
    const destY = Math.min(96, Math.max(4, entity.docY + (Math.random() - 0.5) * 22));
    entity.targetDocX = destX;
    entity.targetDocY = destY;

    soundEngine.playElementalWhoosh('wind');

    const now = performance.now();
    // Only speak if speech slot is open; otherwise fly calmly and quietly
    if (this.canStartIndividualSpeech(now) && Math.random() < 0.6) {
      const def = STICK_MAN_ARCHETYPES[entity.element];
      fetchGenerativeDialogue({
        situation: 'fly',
        speaker: {
          id: entity.id,
          element: entity.element,
          name: entity.name,
          title: entity.title,
          personality: def?.personality || 'Free-spirited wind flyer',
        },
      }).then((res) => {
        entity.activeDialogue = res.speaker1Line;
        entity.dialogueNote = '🍃 Soaring Skywards!';
        this.claimSpeech(entity, 4200, 16000);
      });
    }
  }

  /**
   * Starts Anti-Gravity Floating sequence
   */
  private startFloating(entity: StickManEntity): void {
    entity.state = 'floating';
    entity.encounterTimer = 7.0; // 7 seconds of levitation
    entity.floatPhase = Math.random() * Math.PI * 2;

    soundEngine.playElementalWhoosh(entity.element);

    const now = performance.now();
    if (this.canStartIndividualSpeech(now) && Math.random() < 0.4) {
      const def = STICK_MAN_ARCHETYPES[entity.element];
      fetchGenerativeDialogue({
        situation: 'float',
        speaker: {
          id: entity.id,
          element: entity.element,
          name: entity.name,
          title: entity.title,
          personality: def?.personality || 'Cosmic celestial walker',
        },
      }).then((res) => {
        entity.activeDialogue = res.speaker1Line;
        entity.dialogueNote = '🌌 Zero-G Levitation';
        this.claimSpeech(entity, 4000, 15000);
      });
    }
  }

  /**
   * Starts a friendly social conversation encounter
   */
  private conversationTurnDuration(text: string): number {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(2.6, Math.min(4.8, 1.9 + wordCount * 0.16));
  }

  private setConversationTurn(conversation: ActiveConversation, entities: StickManEntity[]): void {
    const first = entities.find((entity) => entity.id === conversation.firstId);
    const second = entities.find((entity) => entity.id === conversation.secondId);
    const line = conversation.lines[conversation.turnIndex];
    if (!first || !second || !line) return;

    const history = conversation.lines.slice(0, conversation.turnIndex + 1);
    const nextSpeaker = line.speakerId === first.id ? first : second;
    const listener = nextSpeaker.id === first.id ? second : first;

    first.dialogueHistory = history;
    second.dialogueHistory = history;
    first.dialogueSessionId = conversation.id;
    second.dialogueSessionId = conversation.id;
    first.dialogueTurn = conversation.turnIndex + 1;
    second.dialogueTurn = conversation.turnIndex + 1;
    first.dialogueTotalTurns = conversation.lines.length;
    second.dialogueTotalTurns = conversation.lines.length;

    nextSpeaker.isSpeaking = true;
    nextSpeaker.activeDialogue = line.text;
    nextSpeaker.dialoguePhase = 'speaking';
    nextSpeaker.dialogueNote = `Conversation · turn ${conversation.turnIndex + 1} of ${conversation.lines.length}`;

    listener.isSpeaking = false;
    listener.activeDialogue = undefined;
    listener.dialoguePhase = 'listening';
    listener.dialogueNote = `Listening to ${nextSpeaker.name}`;
    this.activeSpeakerId = nextSpeaker.id;
    conversation.turnRemaining = this.conversationTurnDuration(line.text);
    soundEngine.playSpiritClick(nextSpeaker.element);
  }

  private finishConversation(conversation: ActiveConversation, entities: StickManEntity[]): void {
    const first = entities.find((entity) => entity.id === conversation.firstId);
    const second = entities.find((entity) => entity.id === conversation.secondId);

    [first, second].forEach((entity) => {
      if (!entity) return;
      entity.state = 'idle';
      entity.wanderTimer = 3.5;
      entity.dialoguePartnerId = undefined;
      entity.dialogueSessionId = undefined;
      entity.dialoguePhase = undefined;
      entity.dialogueTurn = undefined;
      entity.dialogueTotalTurns = undefined;
      entity.dialogueHistory = undefined;
      entity.isSpeaking = false;
      entity.activeDialogue = undefined;
    });

    this.activeConversation = null;
    this.activeSpeakerId = null;
    this.speechCooldownUntil = performance.now() + 4500;
  }

  private updateActiveConversation(deltaSec: number, entities: StickManEntity[]): void {
    const conversation = this.activeConversation;
    if (!conversation) return;

    const first = entities.find((entity) => entity.id === conversation.firstId);
    const second = entities.find((entity) => entity.id === conversation.secondId);
    if (
      !first ||
      !second ||
      first.state !== 'talking' ||
      second.state !== 'talking' ||
      first.dialogueSessionId !== conversation.id ||
      second.dialogueSessionId !== conversation.id
    ) {
      this.finishConversation(conversation, entities);
      return;
    }

    if (conversation.pauseRemaining > 0) {
      conversation.pauseRemaining -= deltaSec;
      if (conversation.pauseRemaining <= 0) {
        conversation.turnIndex += 1;
        if (conversation.turnIndex >= conversation.lines.length) {
          this.finishConversation(conversation, entities);
        } else {
          this.setConversationTurn(conversation, entities);
        }
      }
      return;
    }

    conversation.turnRemaining -= deltaSec;
    if (conversation.turnRemaining > 0) return;

    const currentSpeaker = conversation.lines[conversation.turnIndex]?.speakerId;
    const speaker = entities.find((entity) => entity.id === currentSpeaker);
    if (speaker) {
      speaker.isSpeaking = false;
      speaker.activeDialogue = undefined;
      speaker.dialoguePhase = 'pause';
      speaker.dialogueNote = 'A thoughtful pause';
    }
    first.dialoguePhase = 'pause';
    second.dialoguePhase = 'pause';
    this.activeSpeakerId = null;
    conversation.pauseRemaining = 0.65;
  }

  private beginConversation(
    char1: StickManEntity,
    char2: StickManEntity,
    conversationId: string,
    response: { speaker1Line: string; speaker2Line?: string }
  ): void {
    if (char1.dialogueSessionId !== conversationId || char2.dialogueSessionId !== conversationId) return;

    const conversation: ActiveConversation = {
      id: conversationId,
      firstId: char1.id,
      secondId: char2.id,
      lines: [
        {
          id: `${conversationId}-1`,
          speakerId: char1.id,
          speakerName: char1.name,
          text: response.speaker1Line,
        },
        {
          id: `${conversationId}-2`,
          speakerId: char2.id,
          speakerName: char2.name,
          text: response.speaker2Line || visitDialogueDeck.getCharacterDialogue(char2.id, 'ambient'),
        },
      ],
      turnIndex: 0,
      turnRemaining: 0,
      pauseRemaining: 0,
    };
    this.activeConversation = conversation;
    this.setConversationTurn(conversation, [char1, char2]);
  }

  private setConversationMeetingTargets(char1: StickManEntity, char2: StickManEntity): void {
    const midpointX = (char1.docX + char2.docX) / 2;
    const midpointY = (char1.docY + char2.docY) / 2;
    const direction = char1.docX <= char2.docX ? 1 : -1;

    char1.targetDocX = midpointX - (direction * CONVERSATION_GAP) / 2;
    char1.targetDocY = midpointY;
    char2.targetDocX = midpointX + (direction * CONVERSATION_GAP) / 2;
    char2.targetDocY = midpointY;
  }

  private placeConversationPair(char1: StickManEntity, char2: StickManEntity): void {
    this.setConversationMeetingTargets(char1, char2);
    char1.docX = char1.targetDocX;
    char1.docY = char1.targetDocY;
    char2.docX = char2.targetDocX;
    char2.docY = char2.targetDocY;
  }

  private cancelApproachingChat(first: StickManEntity, second: StickManEntity): void {
    this.conversationApproaching = false;
    [first, second].forEach((entity) => {
      entity.state = 'idle';
      entity.wanderTimer = 3.5;
      entity.encounterState = undefined;
      entity.encounterTimer = undefined;
      entity.dialoguePartnerId = undefined;
    });
  }

  private startApproachingChat(char1: StickManEntity, char2: StickManEntity): void {
    if (!this.canStartConversation(performance.now())) return;

    const distance = Math.hypot(char2.docX - char1.docX, char2.docY - char1.docY);
    if (distance <= CONVERSATION_MEETING_DISTANCE) {
      this.startSocialChat(char1, char2);
      return;
    }

    char1.state = 'walking';
    char2.state = 'walking';
    char1.encounterState = 'approaching_chat';
    char2.encounterState = 'approaching_chat';
    char1.dialoguePartnerId = char2.id;
    char2.dialoguePartnerId = char1.id;
    char1.encounterTimer = 10;
    char2.encounterTimer = 10;
    this.conversationApproaching = true;
    this.setConversationMeetingTargets(char1, char2);
  }

  private startSocialChat(char1: StickManEntity, char2: StickManEntity): void {
    if (!this.canStartConversation(performance.now())) return;
    // Snap the final few pixels into a comfortable face-to-face distance so
    // the conversation never begins with the characters visibly separated.
    this.placeConversationPair(char1, char2);
    char1.state = 'talking';
    char2.state = 'talking';
    char1.encounterState = undefined;
    char2.encounterState = undefined;
    char1.dialoguePartnerId = char2.id;
    char2.dialoguePartnerId = char1.id;
    char1.encounterTimer = undefined;
    char2.encounterTimer = undefined;
    const conversationId = `conversation-${++this.conversationSequence}`;
    char1.dialogueSessionId = conversationId;
    char2.dialogueSessionId = conversationId;
    char1.dialoguePhase = 'loading';
    char2.dialoguePhase = 'loading';
    char1.dialogueHistory = [];
    char2.dialogueHistory = [];
    char1.dialogueNote = 'Starting a conversation…';
    char2.dialogueNote = 'Getting ready to reply…';
    this.conversationLoadingId = conversationId;

    // Face each other
    const dx = char2.docX - char1.docX;
    const dy = char2.docY - char1.docY;
    char1.headingAngle = Math.atan2(dx, -dy);
    char2.headingAngle = Math.atan2(-dx, dy);

    soundEngine.playSpiritClick(char1.element);

    if (this.conversationLoadingId === conversationId) {
      const def1 = STICK_MAN_ARCHETYPES[char1.element];
      const def2 = STICK_MAN_ARCHETYPES[char2.element];

      fetchGenerativeDialogue({
        situation: 'chat',
        speaker: {
          id: char1.id,
          element: char1.element,
          name: char1.name,
          title: char1.title,
          personality: def1?.personality || 'Friendly guardian',
        },
        target: {
          id: char2.id,
          element: char2.element,
          name: char2.name,
          title: char2.title,
          personality: def2?.personality || 'Wise companion',
        },
        context: char1.districtName,
      }).then((res) => {
        if (this.conversationLoadingId !== conversationId) return;
        this.conversationLoadingId = null;
        this.beginConversation(char1, char2, conversationId, res);
      }).catch(() => {
        if (this.conversationLoadingId !== conversationId) return;
        this.conversationLoadingId = null;
        this.beginConversation(char1, char2, conversationId, {
          speaker1Line: char1.dialogueQuote,
          speaker2Line: char2.dialogueQuote,
        });
      });
    }
  }

  private get3DWorldPosition(
    entity: StickManEntity,
    winWidth: number,
    winHeight: number,
    docHeight: number,
    scrollY: number
  ): { x: number; y: number } {
    const screenX = (entity.docX / 100) * winWidth;
    const screenY = (entity.docY / 100) * docHeight - scrollY;
    return {
      x: screenX - winWidth / 2,
      y: -(screenY - winHeight / 2),
    };
  }

  /**
   * Frame-by-frame updates for active states
   */
  private updateEntityEncounterState(
    entity: StickManEntity,
    deltaSec: number,
    entities: StickManEntity[],
    spellSystem: SpellEffectSystem | null,
    winWidth: number,
    winHeight: number,
    docHeight: number,
    scrollY: number,
    char3DMap?: Map<string, StickMan3DCharacter>,
    spellActions?: SpellActionSystem
  ): void {
    if (spellActions?.isImmobilized(entity.id)) return;
    // Bring a visible pair together before opening their shared conversation.
    if (
      (entity.state === 'walking' || entity.state === 'idle') &&
      entity.encounterState === 'approaching_chat'
    ) {
      const partner = entities.find((candidate) => candidate.id === entity.dialoguePartnerId);
      if (!partner || partner.dialoguePartnerId !== entity.id) {
        if (partner) this.cancelApproachingChat(entity, partner);
        else {
          entity.encounterState = undefined;
          entity.dialoguePartnerId = undefined;
          entity.encounterTimer = undefined;
          entity.state = 'idle';
        }
        return;
      }

      if (
        !this.isInViewport(entity, winHeight, docHeight, scrollY) ||
        !this.isInViewport(partner, winHeight, docHeight, scrollY)
      ) {
        this.cancelApproachingChat(entity, partner);
        return;
      }

      entity.encounterTimer = (entity.encounterTimer || 10) - deltaSec;
      if (entity.encounterTimer <= 0) {
        this.cancelApproachingChat(entity, partner);
        return;
      }

      const distance = Math.hypot(partner.docX - entity.docX, partner.docY - entity.docY);
      if (distance <= CONVERSATION_MEETING_DISTANCE) {
        this.conversationApproaching = false;
        this.startSocialChat(entity, partner);
        return;
      }

      if (entity.state !== 'walking') entity.state = 'walking';
      if (partner.state !== 'walking') partner.state = 'walking';
      this.setConversationMeetingTargets(entity, partner);
      return;
    }
    // ── Approaching Duel ──────────────────────────────────
    if (entity.state === 'walking' && entity.encounterState === 'approaching_duel') {
      const partner = entities.find((e) => e.id === entity.duelPartnerId);
      if (!partner) {
        if (this.activeDuelChallengerId === entity.id) {
          this.activeDuelChallengerId = null;
          this.lastDuelEndTime = performance.now();
        }
        entity.encounterState = undefined;
        entity.duelPartnerId = undefined;
        entity.state = 'idle';
        return;
      }

      // Safety timeout: if combatants do not reach each other within 12s, abort cleanly
      entity.encounterTimer = (entity.encounterTimer || 12.0) - deltaSec;
      if (entity.encounterTimer <= 0) {
        if (this.activeDuelChallengerId === entity.id || this.activeDuelChallengerId === partner.id) {
          this.activeDuelChallengerId = null;
          this.lastDuelEndTime = performance.now();
        }
        entity.encounterState = undefined;
        entity.duelPartnerId = undefined;
        entity.state = 'idle';
        partner.encounterState = undefined;
        partner.duelPartnerId = undefined;
        partner.state = 'idle';
        return;
      }

      const standoffX = entity.docX < partner.docX ? -3.8 : 3.8;
      entity.targetDocX = partner.docX + standoffX;
      entity.targetDocY = partner.docY;

      const dist = Math.hypot(entity.docX - partner.docX, entity.docY - partner.docY);
      if (dist < 4.5) {
        this.startDuelShowdown(entity, partner);
        return;
      }
    }

    // ── Approaching Bully Prank ───────────────────────────
    if (entity.state === 'walking' && entity.encounterState === 'approaching_bully') {
      const victim = entities.find((e) => e.id === entity.bullyPartnerId);
      if (!victim) {
        entity.encounterState = undefined;
        entity.bullyPartnerId = undefined;
        entity.state = 'idle';
        return;
      }
      const sneakX = victim.headingAngle > 0 ? -2.2 : 2.2;
      entity.targetDocX = victim.docX + sneakX;
      entity.targetDocY = victim.docY;

      const dist = Math.hypot(entity.docX - victim.docX, entity.docY - victim.docY);
      if (dist < 3.2) {
        this.startBullyPrankShowdown(entity, victim);
        return;
      }
    }

    // ── Sitting on Card Ledge ─────────────────────────────
    if (entity.state === 'walking' && entity.perchId) {
      // Check if arrived at card perch point
      const dist = Math.hypot(entity.targetDocX - entity.docX, entity.targetDocY - entity.docY);
      if (dist < 1.2) {
        entity.state = 'sitting';
        entity.encounterTimer = 8.0; // Sit for 8 seconds
        entity.headingAngle = entity.perchSide === 'left' ? 0.3 : -0.3; // Face outwards

        // Only speak sparsely when sitting down to maintain tranquility
        const now = performance.now();
        if (this.canStartIndividualSpeech(now) && Math.random() < 0.25) {
          const def = STICK_MAN_ARCHETYPES[entity.element];
          fetchGenerativeDialogue({
            situation: 'sit',
            speaker: {
              id: entity.id,
              element: entity.element,
              name: entity.name,
              title: entity.title,
              personality: def?.personality || 'Relaxed observer',
            },
            context: entity.perchCardName,
          }).then((res) => {
            entity.activeDialogue = res.speaker1Line;
            entity.dialogueNote = `🪑 Perched on ${entity.perchCardName || 'Card'}`;
            this.claimSpeech(entity, 4200, 16000);
          });
        }
      }
    } else if (entity.state === 'sitting') {
      if (entity.encounterTimer !== undefined) {
        entity.encounterTimer -= deltaSec;
        if (entity.encounterTimer <= 0) {
          if (this.activeSpeakerId === entity.id) {
            this.activeSpeakerId = null;
          }
          // Finished sitting, release perch and stand back up
          cardLedgeSystem.releasePerch(entity.id);
          entity.perchId = undefined;
          entity.perchCardName = undefined;
          entity.state = 'cheering';
          entity.wanderTimer = 3.0;
          entity.isSpeaking = false;
          entity.activeDialogue = undefined;
        }
      }
    }

    // ── Wind Flying ───────────────────────────────────────
    if (entity.state === 'flying') {
      if (entity.encounterTimer !== undefined) {
        entity.encounterTimer -= deltaSec;
        const total = 6.0;
        const progress = 1 - entity.encounterTimer / total;

        // Altitude parabolic arc (0 -> peak 35px -> 0)
        entity.flightAltitude = Math.sin(progress * Math.PI) * 38;

        if (entity.encounterTimer <= 0) {
          // Superhero landing!
          if (this.activeSpeakerId === entity.id) {
            this.activeSpeakerId = null;
          }
          entity.flightAltitude = 0;
          entity.state = 'cheering';
          entity.wanderTimer = 3.0;
          entity.isSpeaking = false;
          entity.activeDialogue = undefined;
          soundEngine.playStickManJump();
        }
      }
    }

    // ── Floating / Levitation ─────────────────────────────
    if (entity.state === 'floating') {
      if (entity.encounterTimer !== undefined) {
        entity.encounterTimer -= deltaSec;
        if (entity.floatPhase !== undefined) {
          entity.floatPhase += deltaSec * 2.5;
        }

        if (entity.encounterTimer <= 0) {
          if (this.activeSpeakerId === entity.id) {
            this.activeSpeakerId = null;
          }
          entity.state = 'idle';
          entity.wanderTimer = 3.0;
          entity.isSpeaking = false;
          entity.activeDialogue = undefined;
        }
      }
    }

    // ── Dueling ───────────────────────────────────────────
    if (entity.state === 'dueling') {
      if (entity.encounterTimer !== undefined) {
        // Challenger drives the synchronized duel choreography
        if (entity.duelRole === 'challenger') {
          entity.encounterTimer -= deltaSec;
          const partner = entities.find((e) => e.id === entity.duelPartnerId);
          if (partner && partner.state === 'dueling') {
            partner.encounterTimer = entity.encounterTimer;
          }

          // Step 1: Challenger unleashes first elemental spell at 5.4s
          if (entity.encounterTimer < 5.4 && entity.duelPhase === 'challenge') {
            entity.duelPhase = 'cast1';
            if (partner) {
              partner.duelPhase = 'defend1';
            }
            if (spellSystem) {
              const spells = ELEMENTAL_SPELLS[entity.element] || [];
              const spell = spells[0];
              if (spell) {
                const screenY = (entity.docY / 100) * docHeight - scrollY;
                const isVisible = screenY >= -140 && screenY <= winHeight + 140;

                const casterPos = this.get3DWorldPosition(entity, winWidth, winHeight, docHeight, scrollY);
                const targetPos = partner
                  ? this.get3DWorldPosition(partner, winWidth, winHeight, docHeight, scrollY)
                  : { x: casterPos.x + 90, y: casterPos.y };
                const dx = targetPos.x - casterPos.x;
                const dy = targetPos.y - casterPos.y;
                const travelDist = Math.hypot(dx, dy);
                const heading = Math.atan2(dx, dy);

                const suppressed = spellActions?.isSilenced(entity.id) || false;
                if (isVisible && !suppressed) {
                  spellSystem.castSpell(spell, casterPos.x, casterPos.y, heading, entity.scaleVariant || 1.0, travelDist);
                  soundEngine.playSpell(spell);
                }
                if (partner && !suppressed) spellActions?.cast(spell, entity, [entity, partner], winWidth, docHeight);
                entity.dialogueNote = suppressed ? '🕳️ Magic suppressed!' : `💥 ${spell.name}!`;

                const char3D = char3DMap?.get(entity.id);
                if (char3D) {
                  char3D.castAnimationTime = spell.duration;
                }
              }
            }
          }

          // Step 2: First spell impacts defender at 4.4s -> defender hit recoil!
          if (entity.encounterTimer < 4.4 && entity.duelPhase === 'cast1' && partner?.duelPhase === 'defend1') {
            const blocked = spellActions?.resolveImpact(partner.id) || false;
            partner.duelPhase = blocked ? 'defend1' : 'recoil1';
            partner.dialogueNote = blocked ? '🛡️ Ward absorbed it!' : '💥 Impact!';
            const pScreenY = (partner.docY / 100) * docHeight - scrollY;
            if (pScreenY >= -140 && pScreenY <= winHeight + 140) {
              soundEngine.playFootstep();
            }
          }

          // Step 3: Defender counter-attacks with signature counter-spell at 3.4s!
          if (entity.encounterTimer < 3.4 && (entity.duelPhase === 'cast1' || partner?.duelPhase === 'recoil1')) {
            entity.duelPhase = 'defend2';
            if (partner) {
              partner.duelPhase = 'cast2';
              if (spellSystem) {
                const defSpells = ELEMENTAL_SPELLS[partner.element] || [];
                const counterSpell = defSpells[1] || defSpells[0];
                if (counterSpell) {
                  const partnerScreenY = (partner.docY / 100) * docHeight - scrollY;
                  const isVisible = partnerScreenY >= -140 && partnerScreenY <= winHeight + 140;

                  const casterPos = this.get3DWorldPosition(partner, winWidth, winHeight, docHeight, scrollY);
                  const targetPos = this.get3DWorldPosition(entity, winWidth, winHeight, docHeight, scrollY);
                  const dx = targetPos.x - casterPos.x;
                  const dy = targetPos.y - casterPos.y;
                  const travelDist = Math.hypot(dx, dy);
                  const heading = Math.atan2(dx, dy);

                  const suppressed = spellActions?.isSilenced(partner.id) || false;
                  if (isVisible && !suppressed) {
                    spellSystem.castSpell(counterSpell, casterPos.x, casterPos.y, heading, partner.scaleVariant || 1.0, travelDist);
                    soundEngine.playSpell(counterSpell);
                  }
                  if (!suppressed) spellActions?.cast(counterSpell, partner, [partner, entity], winWidth, docHeight);
                  partner.dialogueNote = suppressed ? '🕳️ Magic suppressed!' : `⚡ ${counterSpell.name}!`;

                  const partnerChar3D = char3DMap?.get(partner.id);
                  if (partnerChar3D) {
                    partnerChar3D.castAnimationTime = counterSpell.duration;
                  }
                }
              }
            }
          }

          // Step 4: Counter-spell impacts challenger at 2.4s -> challenger hit recoil!
          if (entity.encounterTimer < 2.4 && entity.duelPhase === 'defend2' && partner?.duelPhase === 'cast2') {
            const blocked = spellActions?.resolveImpact(entity.id) || false;
            entity.duelPhase = 'recoil2';
            entity.dialogueNote = blocked ? '🛡️ Ward absorbed it!' : '💥 Counter Hit!';
            const eScreenY = (entity.docY / 100) * docHeight - scrollY;
            if (eScreenY >= -140 && eScreenY <= winHeight + 140) {
              soundEngine.playFootstep();
            }
          }

          // Step 5: Mutual respect & martial arts bow at 1.4s!
          if (entity.encounterTimer < 1.4 && (entity.duelPhase === 'recoil2' || partner?.duelPhase === 'cast2')) {
            entity.duelPhase = 'resolve';
            entity.dialogueNote = '✨ Well Fought!';
            if (partner) {
              partner.duelPhase = 'resolve';
              partner.dialogueNote = '⚔️ Good Match!';
            }
          }

          // Step 6: Conclude duel at 0s!
          if (entity.encounterTimer <= 0) {
            this.activeDuelChallengerId = null;
            this.lastDuelEndTime = performance.now();
            if (this.activeSpeakerId === entity.id || (partner && this.activeSpeakerId === partner.id)) {
              this.activeSpeakerId = null;
            }
            entity.state = 'cheering';
            entity.duelPartnerId = undefined;
            entity.duelPhase = undefined;
            entity.duelRole = undefined;
            entity.encounterState = undefined;
            entity.wanderTimer = 3.5;
            entity.isSpeaking = false;
            entity.activeDialogue = undefined;

            if (partner && partner.state === 'dueling') {
              partner.state = 'cheering';
              partner.duelPartnerId = undefined;
              partner.duelPhase = undefined;
              partner.duelRole = undefined;
              partner.encounterState = undefined;
              partner.wanderTimer = 3.5;
              partner.isSpeaking = false;
              partner.activeDialogue = undefined;
            }
          }
        } else if (entity.duelRole === 'defender') {
          // If partner is gone or no longer dueling, recover gracefully
          const partner = entities.find((e) => e.id === entity.duelPartnerId);
          if (!partner || partner.state !== 'dueling') {
            if (this.activeDuelChallengerId === entity.duelPartnerId || this.activeDuelChallengerId === entity.id) {
              this.activeDuelChallengerId = null;
              this.lastDuelEndTime = performance.now();
            }
            entity.state = 'idle';
            entity.duelPartnerId = undefined;
            entity.duelPhase = undefined;
            entity.duelRole = undefined;
            entity.encounterState = undefined;
            entity.wanderTimer = 3.0;
          }
        }
      }
    }

    // ── Bullying / Prank ──────────────────────────────────
    if (entity.state === 'bullying') {
      if (entity.encounterTimer !== undefined) {
        entity.encounterTimer -= deltaSec;

        // Trigger prank jump and startled reaction at 2.8s remaining
        if (entity.encounterTimer < 2.8 && entity.bullyPhase === 'sneak') {
          const partner = entities.find((e) => e.id === entity.bullyPartnerId);
          // Prankster leaps up
          entity.bullyPhase = 'prank';
          entity.dialogueNote = '😏 BOO! PRANKED!';
          soundEngine.playStickManJump();

          // Victim jumps and spins startled
          if (partner && partner.state === 'bullying') {
            partner.bullyPhase = 'react';
            partner.dialogueNote = '💢 STARTLED!';
            soundEngine.playFootstep();
          }
        }

        if (entity.encounterTimer <= 0) {
          if (this.activeSpeakerId === entity.id) {
            this.activeSpeakerId = null;
          }
          entity.state = entity.bullyPhase === 'react' ? 'walking' : 'cheering';
          entity.bullyPartnerId = undefined;
          entity.bullyPhase = undefined;
          entity.encounterState = undefined;
          entity.wanderTimer = 3.0;
          entity.isSpeaking = false;
          entity.activeDialogue = undefined;
        }
      }
    }

    // ── Talking ───────────────────────────────────────────
    if (entity.state === 'talking') {
      if (entity.encounterTimer !== undefined) {
        entity.encounterTimer -= deltaSec;
        if (entity.encounterTimer <= 0) {
          if (this.activeSpeakerId === entity.id) {
            this.activeSpeakerId = null;
          }
          entity.state = 'idle';
          entity.dialoguePartnerId = undefined;
          entity.encounterState = undefined;
          entity.wanderTimer = 3.5;
          entity.isSpeaking = false;
          entity.activeDialogue = undefined;
        }
      }
    }
  }
}

export const openWorldEncounterSystem = new OpenWorldEncounterSystem();
