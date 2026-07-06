import type { AppraisalRecord } from "./appraisals";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const sanitizeFilePart = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "UNKNOWN";

const wrapText = (value: string, maxLength: number) => {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = candidate;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
};

export const exportAppraisalReport = async (appraisal: AppraisalRecord): Promise<void> => {
  if (typeof window === "undefined") {
    throw new Error("PDF export is only available in the browser.");
  }

  const [{ jsPDF }] = await Promise.all([import("jspdf")]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const contentWidth = pageWidth - marginX * 2;
  const lineHeight = 18;

  const safeRegistration = appraisal.registration?.trim() || "UNKNOWN";
  const fileName = `MarginRight-${sanitizeFilePart(safeRegistration)}-appraisal.pdf`;
  const purchasePriceText = appraisal.purchase_price > 0 ? formatCurrency(appraisal.purchase_price) : "Not available";
  const notesText = appraisal.notes?.trim() || "No notes added.";

  let cursorY = 44;

  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight <= pageHeight - 40) {
      return;
    }

    doc.addPage();
    cursorY = 44;
  };

  const addFieldCard = (x: number, y: number, width: number, label: string, value: string) => {
    const lines = doc.splitTextToSize(value, width - 24) as string[];
    const height = Math.max(62, 34 + lines.length * 14);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, width, height, 10, 10, "FD");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), x + 12, y + 18);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(lines, x + 12, y + 34);

    return height;
  };

  doc.setFillColor(5, 8, 22);
  doc.roundedRect(marginX, 24, contentWidth, 86, 16, 16, "F");
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(marginX + 16, 40, 42, 42, 12, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("MR", marginX + 27, 67);
  doc.setFontSize(22);
  doc.text("MarginRight", marginX + 72, 58);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225);
  doc.text("Buying report", marginX + 72, 76);
  doc.text(`Date saved: ${formatDate(appraisal.created_at)}`, marginX + 72, 92);

  cursorY = 130;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text(`Registration: ${safeRegistration}`, marginX, cursorY);
  cursorY += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text("MarginRight Beta: calculations are guidance only. Always verify figures before bidding.", marginX, cursorY);
  cursorY += 28;

  const leftColumnX = marginX;
  const rightColumnX = marginX + contentWidth / 2 + 8;
  const halfWidth = contentWidth / 2 - 8;

  const pairs: Array<[string, string]> = [
    ["Retail value", formatCurrency(appraisal.retail_value)],
    ["Current bid / purchase price", purchasePriceText],
    ["Maximum bid", formatCurrency(appraisal.max_bid)],
    ["Projected profit", formatCurrency(appraisal.projected_profit)],
    ["ROI", formatPercent(appraisal.roi)],
    ["Gross margin", formatPercent(appraisal.gross_margin)],
    ["Decision", appraisal.buy_status || "Not available"],
    ["Date saved", formatDate(appraisal.created_at)],
  ];

  pairs.forEach((field, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = col === 0 ? leftColumnX : rightColumnX;
    const y = cursorY + row * 76;
    const height = addFieldCard(x, y, halfWidth, field[0], field[1]);
    cursorY = Math.max(cursorY, y + height);
  });

  cursorY += 14;

  ensureSpace(120);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cursorY, contentWidth, 110, 12, 12, "FD");
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text("Notes", marginX + 12, cursorY + 18);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  const noteLines = doc.splitTextToSize(notesText, contentWidth - 24);
  doc.text(noteLines, marginX + 12, cursorY + 38);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Generated by MarginRight", marginX, pageHeight - 28);

  doc.save(fileName);
};
