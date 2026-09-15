export interface CardPerchPoint {
  id: string;
  cardName: string;
  district: number;
  docX: number; // 0-100% of document width
  docY: number; // 0-100% of document height
  side: 'left' | 'right' | 'center';
  occupiedBy?: string; // StickManEntity id
}

class CardLedgeSystem {
  private perches: CardPerchPoint[] = [];
  private lastScanTime: number = 0;

  /**
   * Scans document for portfolio cards and computes coordinate perches in % space
   */
  public updatePerches(): CardPerchPoint[] {
    if (typeof window === 'undefined') return [];

    const now = performance.now();
    // Cache perches for 1 second between scans to keep 60 FPS smooth
    if (now - this.lastScanTime < 1200 && this.perches.length > 0) {
      return this.perches;
    }
    this.lastScanTime = now;

    const docWidth = window.innerWidth;
    const docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      docWidth * 2
    );

    const cardElements = document.querySelectorAll<HTMLElement>(
      '[data-perch-card="true"], .portfolio-card, #experience article, #projects article, #skills .portfolio-skill-card, #ai-terminal'
    );

    const newPerches: CardPerchPoint[] = [];

    cardElements.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      const pageTop = rect.top + window.scrollY;
      const pageLeft = rect.left + window.scrollX;
      const cardWidth = rect.width;

      if (cardWidth < 120 || rect.height < 60) return; // Skip tiny elements

      // Estimate district index from vertical %
      const verticalPercent = (pageTop / docHeight) * 100;
      let district = 0;
      if (verticalPercent > 86) district = 5;
      else if (verticalPercent > 73) district = 4;
      else if (verticalPercent > 56) district = 3;
      else if (verticalPercent > 34) district = 2;
      else if (verticalPercent > 14) district = 1;

      const cardTitle =
        el.getAttribute('data-card-title') ||
        el.querySelector('h3, h2, h4')?.textContent?.trim().slice(0, 24) ||
        `Card #${idx + 1}`;

      // Left corner ledge (with slight inset so character rests right on the border)
      newPerches.push({
        id: `perch-${idx}-left`,
        cardName: cardTitle,
        district,
        docX: Math.min(94, Math.max(6, ((pageLeft + 28) / docWidth) * 100)),
        docY: Math.min(98, Math.max(2, (pageTop / docHeight) * 100)),
        side: 'left',
      });

      // Right corner ledge
      newPerches.push({
        id: `perch-${idx}-right`,
        cardName: cardTitle,
        district,
        docX: Math.min(94, Math.max(6, ((pageLeft + cardWidth - 28) / docWidth) * 100)),
        docY: Math.min(98, Math.max(2, (pageTop / docHeight) * 100)),
        side: 'right',
      });
    });

    // Preserve existing occupants if possible
    newPerches.forEach((np) => {
      const old = this.perches.find((op) => op.id === np.id);
      if (old?.occupiedBy) {
        np.occupiedBy = old.occupiedBy;
      }
    });

    this.perches = newPerches;
    return this.perches;
  }

  /**
   * Finds the nearest unoccupied perch for an entity in their district
   */
  public findNearestPerch(
    docX: number,
    docY: number,
    district: number,
    entityId: string
  ): CardPerchPoint | null {
    this.updatePerches();

    const candidates = this.perches.filter(
      (p) =>
        (p.district === district || Math.abs(p.district - district) <= 1) &&
        (!p.occupiedBy || p.occupiedBy === entityId)
    );

    if (candidates.length === 0) return null;

    let nearest: CardPerchPoint | null = null;
    let minDist = Infinity;

    for (const c of candidates) {
      const dist = Math.hypot(c.docX - docX, c.docY - docY);
      if (dist < minDist) {
        minDist = dist;
        nearest = c;
      }
    }

    if (nearest) {
      nearest.occupiedBy = entityId;
    }

    return nearest;
  }

  /**
   * Releases an entity's perch reservation
   */
  public releasePerch(entityId: string): void {
    this.perches.forEach((p) => {
      if (p.occupiedBy === entityId) {
        p.occupiedBy = undefined;
      }
    });
  }
}

export const cardLedgeSystem = new CardLedgeSystem();
