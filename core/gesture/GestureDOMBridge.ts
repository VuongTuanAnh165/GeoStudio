export class GestureDOMBridge {
  private lastTarget: Element | null = null;
  private lastHovered: Element | null = null;
  private isDragging = false;
  private hasTriggeredLongPinch = false;
  private lastX = 0;
  private lastY = 0;
  
  // Throttle hover to prevent lag
  private lastHoverDispatchTime = 0;
  private readonly HOVER_THROTTLE_MS = 100; // max 10 hover events/sec

  public process(state: string, rawX: number, rawY: number) {
    const x = rawX;
    const y = rawY;

    this.lastX = x;
    this.lastY = y;

    const target = document.elementFromPoint(x, y);
    
    // Hover tracking (CSS class for visual feedback)
    if (this.lastHovered && this.lastHovered !== target) {
      this.lastHovered.classList.remove('gesture-hover');
    }
    if (target && this.lastHovered !== target) {
      target.classList.add('gesture-hover');
      this.lastHovered = target;
    }

    if (!target) return { x, y };

    // --- State-based event dispatching ---

    if (state === 'PINCH_START' && !this.isDragging) {
      // New pinch: start a fresh interaction
      this.isDragging = true;
      this.hasTriggeredLongPinch = false;
      this.lastTarget = target;
      this.dispatchMouse(target, 'mousedown', x, y);
      
    } else if (state === 'PINCH_HOLD_LONG' && !this.hasTriggeredLongPinch) {
      // Long pinch: trigger context menu
      this.hasTriggeredLongPinch = true;
      const t = this.lastTarget || target;
      // Release the current mousedown first
      this.dispatchMouse(t, 'mouseup', x, y);
      this.isDragging = false;
      // Then trigger context menu
      t.dispatchEvent(new MouseEvent('contextmenu', {
        bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2
      }));
      
    } else if (this.isDragging && (state === 'DRAGGING' || state === 'PINCH_HOLD' || state === 'PINCH_HOLD_LONG')) {
      // Active drag: send mousemove at full speed
      const t = this.lastTarget || target;
      this.dispatchMouse(t, 'mousemove', x, y);
      
    } else if (this.isDragging && (state === 'PINCH_RELEASE' || state === 'HOVER' || state === 'IDLE')) {
      // Release: end the interaction
      const t = this.lastTarget || target;
      this.dispatchMouse(t, 'mouseup', x, y);
      
      // Synthesize click if we didn't long-press
      if (!this.hasTriggeredLongPinch) {
        this.dispatchMouse(t, 'click', x, y);
      }
      this.isDragging = false;
      this.hasTriggeredLongPinch = false;
      this.lastTarget = null;
      
    } else if (!this.isDragging && (state === 'HOVER' || state === 'IDLE')) {
      // Passive hover: THROTTLE to prevent lag
      const now = Date.now();
      if (now - this.lastHoverDispatchTime >= this.HOVER_THROTTLE_MS) {
        this.lastHoverDispatchTime = now;
        this.dispatchMouse(target, 'mousemove', x, y);
      }
    }
    
    return { x, y };
  }

  /**
   * Reset the bridge state. Call when switching to bimanual mode or on cleanup.
   */
  public reset() {
    if (this.isDragging && this.lastTarget) {
      this.dispatchMouse(this.lastTarget, 'mouseup', this.lastX, this.lastY);
    }
    this.isDragging = false;
    this.hasTriggeredLongPinch = false;
    this.lastTarget = null;
  }

  private dispatchMouse(target: Element, type: string, x: number, y: number) {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: (type === 'mousedown' || type === 'mousemove') && this.isDragging ? 1 : 0,
    });
    target.dispatchEvent(event);
  }
}
