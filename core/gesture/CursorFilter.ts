export class CursorFilter {
  private x = -1;
  private y = -1;
  
  // Pinch lock prevents jitter when fingers press together
  private isPinchLocked = false;
  private pinchLockTimer: any = null;

  public lock(durationMs: number = 150) {
    this.isPinchLocked = true;
    if (this.pinchLockTimer) clearTimeout(this.pinchLockTimer);
    this.pinchLockTimer = setTimeout(() => {
      this.isPinchLocked = false;
    }, durationMs);
  }

  public update(rawX: number, rawY: number): { x: number, y: number } {
    if (this.isPinchLocked && this.x !== -1) {
      // Freeze position to avoid click jitter
      return { x: this.x, y: this.y };
    }

    if (this.x === -1) {
      this.x = rawX;
      this.y = rawY;
    } else {
      // Dynamic Exponential Moving Average (EMA)
      // Moving fast = high alpha (low latency)
      // Moving slow = low alpha (high precision / heavy smoothing)
      const dx = rawX - this.x;
      const dy = rawY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      let alpha = 0.15 + (distance / 50) * 0.45; 
      alpha = Math.max(0.1, Math.min(0.8, alpha));

      this.x = this.x + alpha * dx;
      this.y = this.y + alpha * dy;
    }
    return { x: this.x, y: this.y };
  }

  public reset() {
    this.x = -1;
    this.y = -1;
    this.isPinchLocked = false;
    if (this.pinchLockTimer) clearTimeout(this.pinchLockTimer);
  }
}
