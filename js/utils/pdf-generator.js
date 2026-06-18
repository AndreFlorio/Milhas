import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { buildReservationCardHTML } from './reservation-card.js';

/**
 * Gera PDF visual idêntico ao comprovante TAP/MilhasPix (render HTML → canvas → PDF)
 */
export async function generateReservationPDF(reservation, options = {}) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;padding:24px;background:#f1f5f9;';
  wrapper.innerHTML = buildReservationCardHTML(reservation, { ...options, forPdf: true });
  document.body.appendChild(wrapper);

  const card = wrapper.querySelector('.pdf-reservation-card');

  try {
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f1f5f9',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const doc = new jsPDF({
      orientation: pdfHeight > 297 ? 'portrait' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, Math.min(pdfHeight + 10, 400)],
    });

    doc.addImage(imgData, 'PNG', 0, 5, pdfWidth, pdfHeight);
    doc.save(`reserva_${reservation.locator}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
}
