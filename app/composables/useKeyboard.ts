import { onMounted, onUnmounted } from 'vue';
import { useGeometryStore } from '../stores/geometry';
import { DeleteObjectCommand } from '../../core/commands/deletions';
import { ClipboardManager } from '../../core/clipboard/ClipboardManager';

export function useKeyboard() {
  const store = useGeometryStore();

  const handleKeyDown = (e: KeyboardEvent) => {
    // Avoid intercepting shortcuts if the user is typing in an input or textarea
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    if (isInput) return;

    // View & Core shortcuts with Modifiers (Ctrl/Cmd)
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '0') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('geostudio:zoom-reset'));
      }
      else if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        // Select All
        const allIds = Array.from(store.objects.keys());
        store.selectObjects(allIds);
      }
      else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          store.redo();
        } else {
          store.undo();
        }
      }
      else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        store.redo();
      }
      else if (e.key.toLowerCase() === 'c') {
        // Only if we have a selection, and not in text input
        if (store.selectedIds.size > 0) {
          e.preventDefault();
          ClipboardManager.copy(store.rawState, Array.from(store.selectedIds));
        }
      }
      else if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        ClipboardManager.paste(store.rawState).then(cmd => {
          if (cmd) {
            store.executeCommand(cmd);
          }
        });
      }
      else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (store.selectedIds.size > 0) {
          ClipboardManager.copy(store.rawState, Array.from(store.selectedIds)).then(() => {
            ClipboardManager.paste(store.rawState).then(cmd => {
              if (cmd) store.executeCommand(cmd);
            });
          });
        }
      }
      return; // Do not process single-key tool shortcuts if a modifier is pressed
    }

    // Process Tool & Other Shortcuts (No modifiers)
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        if (store.selectedIds.size > 0) {
          store.beginBatch('Delete Selected');
          store.selectedIds.forEach(id => {
            store.executeCommand(new DeleteObjectCommand(id));
          });
          store.endBatch();
          store.selectObjects([]);
        } else {
          store.activeToolType = 'delete';
        }
        break;
      case 'Escape':
        if (store.selectedIds.size > 0) {
          // If we have a selection, escape clears the selection
          store.selectObjects([]);
        } else {
          // Otherwise, revert to 'select' tool
          store.activeToolType = 'select';
        }
        break;
      case 'v':
      case 'V':
        store.activeToolType = 'select';
        break;
      case 'p':
      case 'P':
        store.activeToolType = 'point';
        break;
      case 'l':
      case 'L':
        store.activeToolType = 'line';
        break;
      case 's':
      case 'S':
        store.activeToolType = 'segment';
        break;
      case 'c':
      case 'C':
        store.activeToolType = 'circle';
        break;
      case 't':
      case 'T':
        store.activeToolType = 'triangle';
        break;
      case 'r':
      case 'R':
        store.activeToolType = 'ray';
        break;
      case 'g':
      case 'G':
        store.activeToolType = 'polygon';
        break;
      case 'f':
      case 'F':
        // Fit/Frame functionality if we implement it, handled similarly to zoom reset
        window.dispatchEvent(new CustomEvent('geostudio:zoom-fit'));
        break;
      case 'F11':
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('geostudio:toggle-presentation'));
        break;
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
}
