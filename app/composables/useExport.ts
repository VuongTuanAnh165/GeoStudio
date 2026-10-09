import html2canvas from 'html2canvas';
import { useGeometryStore } from '../stores/geometry';
import type { GeoDocument } from '../../core/types/document';

export function useExport() {
  const store = useGeometryStore();

  const downloadFile = (filename: string, content: string | Blob, contentType: string = 'text/plain') => {
    const a = document.createElement('a');
    
    let url: string;
    if (content instanceof Blob) {
      url = URL.createObjectURL(content);
    } else {
      const blob = new Blob([content], { type: contentType });
      url = URL.createObjectURL(blob);
    }
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const title = store.currentDocument.metadata.title || 'document';
    const jsonStr = JSON.stringify(store.currentDocument, null, 2);
    downloadFile(`${title.replace(/\s+/g, '_')}.json`, jsonStr, 'application/json');
  };

  const exportPNG = async (canvasSelector: string = '#jxgbox') => {
    const title = store.currentDocument.metadata.title || 'document';
    const element = document.querySelector(canvasSelector) as HTMLElement;
    
    if (!element) {
      console.error('Canvas element not found for export');
      return;
    }

    try {
      // JSXGraph creates multiple overlay SVGs and HTML divs for text
      // html2canvas is the most reliable way to snapshot it all
      const canvas = await html2canvas(element, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc',
        scale: 2 // High res
      });

      canvas.toBlob((blob) => {
        if (blob) {
          downloadFile(`${title.replace(/\s+/g, '_')}.png`, blob, 'image/png');
        }
      });
    } catch (e) {
      console.error('Failed to export PNG:', e);
    }
  };

  const exportSVG = () => {
    const title = store.currentDocument.metadata.title || 'document';
    const renderer = (window as any).__geostudio_renderer;
    
    if (renderer && renderer.board && renderer.board.renderer && renderer.board.renderer.svgRoot) {
      const svgElement = renderer.board.renderer.svgRoot.cloneNode(true) as SVGSVGElement;
      
      // Need to add xmlns if not present
      if (!svgElement.getAttribute('xmlns')) {
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      
      const svgStr = svgElement.outerHTML;
      downloadFile(`${title.replace(/\s+/g, '_')}.svg`, svgStr, 'image/svg+xml');
    } else {
      // Fallback: manually find the SVG
      const element = document.querySelector('#jxgbox svg');
      if (element) {
        const svgStr = element.outerHTML;
        downloadFile(`${title.replace(/\s+/g, '_')}.svg`, svgStr, 'image/svg+xml');
      } else {
        console.error('No SVG found');
      }
    }
  };

  const printDocument = () => {
    window.print();
  };

  return {
    exportJSON,
    exportPNG,
    exportSVG,
    printDocument
  };
}
