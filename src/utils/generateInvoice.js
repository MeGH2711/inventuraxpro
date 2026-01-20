import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import billLogo from '../assets/images/billLogo.png';

export const generateInvoice = async (data, company = {}) => {
    if (!company) { company = {}; }

    const {
        nextBillNumber,
        billingData,
        cart,
        subTotal,
        overallDiscount,
        finalCalculatedTotal
    } = data;

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const brandColor = [139, 0, 0];
    const secondaryColor = [184, 134, 11];

    // --- Helpers (Same as previous) ---
    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatDisplayTime = (timeStr) => {
        if (!timeStr) return "";
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const getNumericTimestamp = (dateStr, timeStr) => {
        if (!dateStr || !timeStr) return "000000000000";
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const cleanTime = timeStr.replace(':', '');
        return `${day}${month}${year}${cleanTime}`;
    };

    // --- 1. Premium Header & Branding ---
    try { doc.addImage(billLogo, 'PNG', margin, 12, 28, 28); } catch (e) { }

    doc.setFont("helvetica", "bold").setFontSize(24).setTextColor(...brandColor);
    doc.text(company?.brandName || "De Baker's & More", pageWidth - margin, 22, { align: "right" });

    doc.setFontSize(10).setTextColor(80).setFont("helvetica", "normal");
    doc.text(company?.companyName || "Vekaria Foods", pageWidth - margin, 28, { align: "right" });
    doc.text(`${company?.address1 || ""}, ${company?.address2 || ""}`, pageWidth - margin, 33, { align: "right" });
    doc.text(company?.address3 || "", pageWidth - margin, 38, { align: "right" });
    doc.setFont("helvetica", "bold").text(`Phone: ${company?.phone || ""} | FSSAI: ${company?.fssai || ""}`, pageWidth - margin, 43, { align: "right" });

    doc.setDrawColor(...secondaryColor).setLineWidth(1).line(margin, 48, pageWidth - margin, 48);

    // --- 2. Information Grid (Side-by-Side) ---
    let infoY = 58;
    const labelOffset = 38;
    doc.setFontSize(10).setTextColor(0);

    doc.setFont("helvetica", "bold").text("Customer Name:", margin, infoY);
    doc.setFont("helvetica", "normal").text(`${billingData?.customerName || ""}`, margin + labelOffset, infoY);
    doc.setFont("helvetica", "bold").text("Contact Number:", pageWidth / 2 + 5, infoY);
    doc.setFont("helvetica", "normal").text(`${billingData?.contactNumber || ""}`, (pageWidth / 2 + 5) + labelOffset, infoY);

    infoY += 7;
    doc.setFont("helvetica", "bold").text("Bill Number:", margin, infoY);
    doc.setFont("helvetica", "normal").text(`#${nextBillNumber || ""}`, margin + labelOffset, infoY);
    doc.setFont("helvetica", "bold").text("Payment Mode:", pageWidth / 2 + 5, infoY);
    doc.setFont("helvetica", "normal").text(`${billingData?.paymentMode || ""}`, (pageWidth / 2 + 5) + labelOffset, infoY);

    infoY += 7;
    doc.setFont("helvetica", "bold").text("Delivery Mode:", margin, infoY);
    doc.setFont("helvetica", "normal").text(`${billingData?.deliveryMode || ""}`, margin + labelOffset, infoY);
    doc.setFont("helvetica", "bold").text("Billing Date:", pageWidth / 2 + 5, infoY);
    doc.setFont("helvetica", "normal").text(`${formatDisplayDate(billingData?.billingDate)}`, (pageWidth / 2 + 5) + labelOffset, infoY);

    infoY += 7;
    doc.setFont("helvetica", "bold").text("Billing Time:", margin, infoY);
    doc.setFont("helvetica", "normal").text(`${formatDisplayTime(billingData?.billingTime)}`, margin + labelOffset, infoY);

    // --- 3. Product Table ---
    autoTable(doc, {
        startY: infoY + 8,
        head: [["Item Description", "Qty", "Rate", "Total", "Disc %", "Final"]],
        body: cart.map(item => [item.name, item.qty, item.price.toFixed(2), (item.qty * item.price).toFixed(2), `${item.discount}%`, item.discountedTotal.toFixed(2)]),
        theme: 'grid',
        headStyles: { fillColor: brandColor, textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3, halign: 'center', valign: 'middle', lineColor: [220, 220, 220] },
        columnStyles: { 0: { cellWidth: 'auto', halign: 'left' }, 5: { fontStyle: 'bold' } },
        margin: { left: margin, right: margin }
    });

    // --- 4. Summary & Payment Blocks ---
    const tableEndY = doc.lastAutoTable.finalY + 8;
    const summaryX = pageWidth - 80;

    doc.setFillColor(248, 248, 248).rect(summaryX, tableEndY, 65, 30, 'F');
    doc.setFontSize(10).setTextColor(0).setFont("helvetica", "normal");
    doc.text("Sub-Total:", summaryX + 3, tableEndY + 8);
    doc.text(`Rs. ${subTotal.toFixed(2)}`, pageWidth - margin - 3, tableEndY + 8, { align: 'right' });
    doc.text(`Discount (${overallDiscount}%):`, summaryX + 3, tableEndY + 15);
    doc.text(`- Rs. ${(subTotal - finalCalculatedTotal).toFixed(2)}`, pageWidth - margin - 3, tableEndY + 15, { align: 'right' });
    doc.setDrawColor(200).line(summaryX + 3, tableEndY + 19, pageWidth - margin - 3, tableEndY + 19);
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...brandColor);
    doc.text("Grand Total:", summaryX + 3, tableEndY + 25);
    doc.text(`Rs. ${finalCalculatedTotal.toFixed(2)}`, pageWidth - margin - 3, tableEndY + 25, { align: 'right' });

    // Payment Section
    const paymentY = tableEndY + 45;
    const boxHeight = 40;
    const boxStartY = paymentY - 8;
    const upiId = company?.upiId || "Q355693476@ybl";
    const upiNumber = company?.phone || "+91 9879718228";
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(company?.brandName || "De Bakers")}&am=${finalCalculatedTotal.toFixed(2)}&cu=INR`;

    doc.setDrawColor(...secondaryColor).setLineWidth(0.5).rect(margin, boxStartY, pageWidth - (margin * 2), boxHeight);
    doc.setFontSize(14).setFont("helvetica", "bold").setTextColor(...brandColor);
    doc.text("SCAN & PAY", margin + 5, paymentY);
    doc.setFontSize(9).setTextColor(0).setFont("helvetica", "normal");
    doc.text(`Pay Directly on ${upiNumber}`, margin + 5, paymentY + 8);
    doc.text(`UPI ID: ${upiId}`, margin + 5, paymentY + 13);

    // QR Code
    try {
        const qrSize = 30;
        const qrVerticalOffset = boxStartY + ((boxHeight - qrSize) / 2);
        const qrHorizontalOffset = pageWidth - margin - qrSize - 5;
        const qrDataUrl = await QRCode.toDataURL(upiLink, { margin: 1, width: 150 });
        doc.addImage(qrDataUrl, 'PNG', qrHorizontalOffset, qrVerticalOffset, qrSize, qrSize);
    } catch (e) { console.error("QR Error", e); }

    // --- 5. Footer with Clickable Links ---
    const footerY = 280;
    doc.setFontSize(8).setTextColor(150).setFont("helvetica", "normal");
    doc.text("Thank you for choosing De Baker's & More!", pageWidth / 2, footerY, { align: "center" });

    doc.setTextColor(0, 0, 255).setFont("helvetica", "bold"); // Blue for links

    // Instagram Link
    const igText = `Instagram: ${company?.instagramName || "@YourInstaHandle"}`;
    const igWidth = doc.getTextWidth(igText);
    const igX = (pageWidth / 2) - igWidth - 5;
    doc.text(igText, igX, footerY + 5);
    if (company?.instagramLink) {
        doc.link(igX, footerY + 1, igWidth, 5, { url: company.instagramLink });
        doc.setDrawColor(0, 0, 255).line(igX, footerY + 5.5, igX + igWidth, footerY + 5.5); // Underline
    }

    // YouTube Link
    const ytText = `YouTube: ${company?.youtubeName || "@YourYoutubeHandle"}`;
    const ytWidth = doc.getTextWidth(ytText);
    const ytX = (pageWidth / 2) + 5;
    doc.text(ytText, ytX, footerY + 5);
    if (company?.youtubeLink) {
        doc.link(ytX, footerY + 1, ytWidth, 5, { url: company.youtubeLink });
        doc.setDrawColor(0, 0, 255).line(ytX, footerY + 5.5, ytX + ytWidth, footerY + 5.5); // Underline
    }

    // --- Save File ---
    const numericStamp = getNumericTimestamp(billingData?.billingDate, billingData?.billingTime);
    const customerName = (billingData?.customerName || "Customer").replace(/\s/g, '_');
    doc.save(`${nextBillNumber || '000'}_${customerName}_${numericStamp}.pdf`);
};