export class GestureDOMBridge {
  private lastTarget: Element | null = null;
  private lastHovered: Element | null = null;
  private isDragging = false;
  private hasTriggeredLongPinch = false;
  private lastX = 0;
  private lastY = 0;

  public process(state: string, rawX: number, rawY: number) {
    const x = rawX;
    const y = rawY;

    this.lastX = x;
    this.lastY = y;

    // To prevent severe layout thrashing (lag) during 60fps drag, 
    // we only sample elementFromPoint when hovering, or if lastTarget is null.
    let target: Element | null = null;
    
    // If lastTarget was removed from the DOM (e.g. temporary preview objects), clear it
    if (this.lastTarget && !this.lastTarget.isConnected) {
      this.lastTarget = document.getElementById('jxgbox') || document.body;
    }

    if (this.isDragging && this.lastTarget) {
      target = this.lastTarget;
    } else {
      target = document.elementFromPoint(x, y);
    }
    
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
      
      this.isDragging = false;
      this.hasTriggeredLongPinch = false;
      this.lastTarget = null;
      
    } else if (!this.isDragging && (state === 'HOVER' || state === 'IDLE')) {
      // Passive hover: send pointermove directly for 60fps smoothness
      this.dispatchMouse(target, 'mousemove', x, y);
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
    // JSXGraph and modern libraries rely on PointerEvent for drag/draw
    const pointerType = type.replace('mouse', 'pointer');
    
    // We also dispatch native mouse events for fallback compatibility
    const buttons = (type === 'mousedown' || type === 'mousemove') && this.isDragging ? 1 : 0;
    
    const pointerEvent = new PointerEvent(pointerType, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0,
      buttons,
      pointerId: 1, // Must be consistent so JSXGraph tracks the drag correctly
      pointerType: 'mouse', // Tricks JSXGraph into thinking it's a real mouse
      isPrimary: true,
    });
    target.dispatchEvent(pointerEvent);

    // If it's a click, we just send a MouseEvent
    if (type === 'click') {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: 0,
      });
      target.dispatchEvent(clickEvent);
    }
  }
}
