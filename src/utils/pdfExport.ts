import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * Exports the invoice container directly as a downloaded A4 PDF file.
 * Uses html-to-image which delegates rendering to the browser's native engine
 * via SVG foreignObject, fully supporting Tailwind v4's oklch() color model,
 * custom fonts, borders, and modern CSS.
 */
export async function downloadInvoicePdf(
  elementId: string,
  fileName: string = 'invoice.pdf'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    window.print();
    return false;
  }

  try {
    // Generate high-resolution PNG (pixelRatio: 2 for clean, sharp 300DPI rendering)
    const imgData = await toPng(element, {
      pixelRatio: 2,
      quality: 1,
      backgroundColor: '#ffffff',
      cacheBust: false,
      skipFonts: true,
      filter: (node: HTMLElement) => {
        // Exclude elements with no-print class
        if (node.classList && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      },
    });

    // Load image to determine real pixel dimensions
    const img = new Image();
    img.src = imgData;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
    });

    // Standard A4 dimensions in mm: 210 x 297 mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    // Fit cleanly to page width with 8mm safety margins
    const marginX = 8;
    const marginY = 8;
    const printableWidth = pageWidth - marginX * 2; // 194mm
    const printableHeight = pageHeight - marginY * 2; // 281mm

    // Proportional height of the rendered element in mm
    const totalRenderedHeight = (img.height * printableWidth) / img.width;

    // Single page check
    // If the invoice comfortably fits in 1 page (or with minor leeway up to 1.1x A4),
    // scale to fit onto exactly 1 single pristine page!
    if (totalRenderedHeight <= printableHeight * 1.18) {
      // Scale slightly if needed to guarantee a perfect 1-page document with zero split
      const scaleFactor = totalRenderedHeight > printableHeight ? printableHeight / totalRenderedHeight : 1;
      const finalWidth = printableWidth * scaleFactor;
      const finalHeight = totalRenderedHeight * scaleFactor;
      const finalMarginX = (pageWidth - finalWidth) / 2;
      const finalMarginY = marginY;

      pdf.addImage(imgData, 'PNG', finalMarginX, finalMarginY, finalWidth, finalHeight, undefined, 'FAST');
    } else {
      // Multi-page document:
      // Slice cleanly using canvas to prevent repeating background or sliced lines
      const sliceCanvas = document.createElement('canvas');
      const ctx = sliceCanvas.getContext('2d');

      // The pixel height on the source image that corresponds to one printable A4 page
      const srcPageHeightPx = Math.floor((printableHeight * img.width) / printableWidth);
      let yOffset = 0;
      let pageIndex = 0;

      while (yOffset < img.height) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const remainingHeightPx = img.height - yOffset;
        const currentSliceHeightPx = Math.min(srcPageHeightPx, remainingHeightPx);

        sliceCanvas.width = img.width;
        sliceCanvas.height = currentSliceHeightPx;

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          // Draw the exact slice from the source image
          ctx.drawImage(
            img,
            0,
            yOffset,
            img.width,
            currentSliceHeightPx,
            0,
            0,
            img.width,
            currentSliceHeightPx
          );
        }

        const sliceDataUrl = sliceCanvas.toDataURL('image/png', 1.0);
        const sliceMmHeight = (currentSliceHeightPx * printableWidth) / img.width;

        pdf.addImage(sliceDataUrl, 'PNG', marginX, marginY, printableWidth, sliceMmHeight, undefined, 'FAST');

        yOffset += srcPageHeightPx;
        pageIndex++;
      }
    }

    const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    pdf.save(safeName);
    return true;
  } catch (error) {
    console.error('Failed to generate PDF via html-to-image/jsPDF:', error);
    // Fallback to window.print if browser blocks canvas extraction
    try {
      window.print();
    } catch (e) {
      console.error('Print fallback failed:', e);
    }
    return false;
  }
}
