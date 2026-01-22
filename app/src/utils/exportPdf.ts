import jsPDF from 'jspdf';

interface QuestionPart {
  id: string;
  label: string;
  statement: string;
  max_score: number;
}

interface Question {
  statement: string;
  year: number | null;
  convocatoria: string | null;
}

interface PracticeStats {
  timerEnabled: boolean;
  totalTimeMinutes: number;
  timeUsedSeconds: number;
  pauseCount: number;
  maxPauses: number;
  totalPausedTime: number;
}

interface ExportOptions {
  question: Question;
  parts: QuestionPart[];
  answers: Record<string, string>;
  blockName?: string;
  practiceStats?: PracticeStats;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins} min ${secs} seg`;
  }
  return `${secs} seg`;
}

function formatPausedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes} min ${seconds} seg`;
  }
  return `${seconds} seg`;
}

export async function exportAnswersToPdf({
  question,
  parts,
  answers,
  blockName = 'Práctica',
  practiceStats,
}: ExportOptions): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = 20;

  // Helper to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 11): number => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * (fontSize * 0.4);
  };

  // Helper to check and add new page if needed
  const checkNewPage = (neededHeight: number): void => {
    if (yPosition + neededHeight > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(blockName, margin, yPosition);
  yPosition += 8;

  // Exam info
  if (question.year && question.convocatoria) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${question.convocatoria} ${question.year}`, margin, yPosition);
    yPosition += 6;
  }

  // Date
  doc.setFontSize(9);
  doc.text(`Exportado: ${new Date().toLocaleString('es-ES')}`, margin, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 12;

  // Practice Statistics
  if (practiceStats) {
    checkNewPage(50);
    
    // Stats header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175); // Blue color
    doc.text('Estadísticas de práctica', margin, yPosition);
    yPosition += 6;
    
    // Stats box
    const statsBoxY = yPosition;
    doc.setDrawColor(147, 197, 253); // Light blue border
    doc.setFillColor(239, 246, 255); // Very light blue background
    
    const answeredParts = parts.filter(p => (answers[p.id]?.trim().length || 0) > 0);
    const totalCharacters = Object.values(answers).reduce((acc, a) => acc + (a?.length || 0), 0);
    
    // Build stats content
    const statsLines: string[] = [];
    
    if (practiceStats.timerEnabled) {
      const timeUsed = practiceStats.totalTimeMinutes * 60 - practiceStats.timeUsedSeconds;
      statsLines.push(`• Tiempo empleado: ${formatTime(timeUsed)} de ${practiceStats.totalTimeMinutes} min`);
      
      if (practiceStats.maxPauses > 0) {
        let pauseText = `• Pausas utilizadas: ${practiceStats.pauseCount} de ${practiceStats.maxPauses}`;
        if (practiceStats.totalPausedTime > 0) {
          pauseText += ` (${formatPausedTime(practiceStats.totalPausedTime)} en total)`;
        }
        statsLines.push(pauseText);
      }
    }
    
    statsLines.push(`• Apartados respondidos: ${answeredParts.length} de ${parts.length} (${Math.round((answeredParts.length / parts.length) * 100)}%)`);
    statsLines.push(`• Caracteres escritos: ${totalCharacters.toLocaleString()} (~${Math.ceil(totalCharacters / 5)} palabras)`);
    
    const boxHeight = statsLines.length * 6 + 8;
    doc.roundedRect(margin, statsBoxY - 2, contentWidth, boxHeight, 2, 2, 'FD');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175);
    
    statsLines.forEach((line, index) => {
      doc.text(line, margin + 4, statsBoxY + 4 + (index * 6));
    });
    
    yPosition = statsBoxY + boxHeight + 8;
    doc.setTextColor(0, 0, 0);
  }

  // Question statement
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Enunciado:', margin, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(question.statement, margin, yPosition, contentWidth, 11);
  yPosition += 10;

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Answers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Respuestas:', margin, yPosition);
  yPosition += 8;

  for (const part of parts) {
    const answer = answers[part.id]?.trim() || '';
    
    // Estimate height needed
    const headerHeight = 8;
    const answerLines = answer ? doc.splitTextToSize(answer, contentWidth - 10) : ['(Sin respuesta)'];
    const answerHeight = answerLines.length * 5 + 10;
    
    checkNewPage(headerHeight + answerHeight + 15);

    // Part header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${part.label}) ${part.statement}`, margin, yPosition);
    yPosition += 5;

    // Score
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`(${part.max_score} puntos)`, margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 6;

    // Answer box
    const boxStartY = yPosition;
    
    if (answer) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      yPosition = addWrappedText(answer, margin + 5, yPosition + 4, contentWidth - 10, 10);
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('(Sin respuesta)', margin + 5, yPosition + 4);
      doc.setTextColor(0, 0, 0);
      yPosition += 6;
    }

    // Draw box around answer
    const boxHeight = Math.max(yPosition - boxStartY + 4, 12);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(margin, boxStartY - 2, contentWidth, boxHeight, 2, 2, 'S');
    
    yPosition += 10;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Generate filename
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `respuestas_${blockName.toLowerCase().replace(/\s+/g, '_')}_${dateStr}.pdf`;

  // Download
  doc.save(filename);
}
