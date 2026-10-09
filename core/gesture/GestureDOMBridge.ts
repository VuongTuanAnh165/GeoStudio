export class GestureDOMBridge {
  private lastTarget: Element | null = null;
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;

  public process(state: string, x: number, y: number) {
    this.lastX = x;
    this.lastY = y;
    
    // Hide the virtual cursor temporarily to find the element underneath it
    // Alternatively, just make sure VirtualCursor has pointer-events: none in CSS
    const target = document.elementFromPoint(x, y);
    if (!target) return;

    if (state === 'PINCH_START') {
      this.isDragging = true;
      this.lastTarget = target;
      this.dispatch(target, 'pointerdown', x, y);
    } else if (state === 'DRAGGING' || (this.isDragging && state === 'PINCH_HOLD')) {
      const dispatchTarget = this.lastTarget || target;
      this.dispatch(dispatchTarget, 'pointermove', x, y);
    } else if (state === 'PINCH_RELEASE') {
      if (this.isDragging) {
        const dispatchTarget = this.lastTarget || target;
        this.dispatch(dispatchTarget, 'pointerup', x, y);
        
        // Synthesize click if released on the same target
        if (target === this.lastTarget) {
          this.dispatch(target, 'click', x, y);
        }
        this.isDragging = false;
        this.lastTarget = null;
      }
    } else if (state === 'HOVER' || state === 'IDLE') {
      // Just hover move
      this.dispatch(target, 'pointermove', x, y);
    }
  }

  private dispatch(target: Element, type: string, x: number, y: number) {
    let event: Event;
    
    if (type === 'click') {
      event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: 0,
      });
    } else {
      event = new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: this.isDragging ? 1 : 0,
        pointerId: 999, // dummy pointer id
        pointerType: 'mouse', // masquerade as mouse for JSXGraph
        isPrimary: true
      });
    }
    
    target.dispatchEvent(event);
  }
}
