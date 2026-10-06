import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { buildS3Key, uploadToS3 } from '@/lib/documentStorage';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
      include: {
        candidate: true,
        requisition: {
          include: {
            department: true,
            location: true,
          },
        },
        organization: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Determine version
    const existingOfferDocs = await prisma.document.findMany({
      where: { offerId: offer.id },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (existingOfferDocs[0]?.version || 0) + 1;

    // 1. Generate PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size in points
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const primaryColor = rgb(0.31, 0.27, 0.90); // #4f46e5 indigo
    const textColor = rgb(0.1, 0.1, 0.1);
    const mutedColor = rgb(0.4, 0.4, 0.4);

    // Header Bar
    page.drawRectangle({
      x: 0,
      y: height - 8,
      width,
      height: 8,
      color: primaryColor,
    });

    // Company Name & Info
    const companyName = offer.organization?.name || 'InfiniteCareers Enterprise India Pvt. Ltd.';
    page.drawText(companyName, {
      x: 40,
      y: height - 50,
      size: 16,
      font: fontBold,
      color: primaryColor,
    });

    page.drawText('Mindspace IT Park, Building 12B, HITEC City, Hyderabad, Telangana 500081', {
      x: 40,
      y: height - 68,
      size: 9,
      font: fontOblique,
      color: mutedColor,
    });

    // Divider
    page.drawLine({
      start: { x: 40, y: height - 80 },
      end: { x: width - 40, y: height - 80 },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Date & Ref
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    page.drawText(`Date: ${today}`, { x: 40, y: height - 105, size: 9, font: fontRegular, color: textColor });
    page.drawText(`Reference: ${offer.offerNumber} (Version ${nextVersion})`, { x: width - 220, y: height - 105, size: 9, font: fontBold, color: textColor });

    // Candidate Salutation
    const candidateName = `${offer.candidate.firstName} ${offer.candidate.lastName}`;
    page.drawText('To,', { x: 40, y: height - 130, size: 10, font: fontRegular, color: textColor });
    page.drawText(candidateName, { x: 40, y: height - 145, size: 11, font: fontBold, color: textColor });
    page.drawText(offer.candidate.email, { x: 40, y: height - 160, size: 9, font: fontRegular, color: mutedColor });

    // Subject
    page.drawText('Subject: Formal Employment Offer Letter', {
      x: 40,
      y: height - 185,
      size: 11,
      font: fontBold,
      color: primaryColor,
    });

    // Opening Paragraph
    const deptName = offer.requisition?.department?.name || 'Engineering & Platform';
    const locName = offer.requisition?.location?.name || 'Hyderabad, India';
    const startDateStr = new Date(offer.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    page.drawText(
      `Dear ${offer.candidate.firstName},`,
      { x: 40, y: height - 215, size: 10, font: fontBold, color: textColor }
    );

    const bodyText = `We are pleased to offer you the full-time position of ${offer.title} within our ${deptName} team at ${locName}. Your technical proficiency, leadership capabilities, and interview performance were outstanding. Your proposed joining date is ${startDateStr}.`;

    page.drawText(bodyText, {
      x: 40,
      y: height - 235,
      size: 9.5,
      font: fontRegular,
      color: textColor,
      maxWidth: width - 80,
      lineHeight: 14,
    });

    // Compensation Section Box
    page.drawRectangle({
      x: 40,
      y: height - 375,
      width: width - 80,
      height: 95,
      color: rgb(0.97, 0.98, 1.0),
      borderColor: rgb(0.85, 0.88, 0.95),
      borderWidth: 1,
    });

    page.drawText('1. Annual Compensation & Benefits Structure', {
      x: 50,
      y: height - 300,
      size: 10,
      font: fontBold,
      color: primaryColor,
    });

    const formatInr = (amt: number) => `₹ ${amt.toLocaleString('en-IN')}`;

    page.drawText(`• Annual Base Salary (CTC): ${formatInr(offer.baseSalary)}`, {
      x: 50,
      y: height - 320,
      size: 9.5,
      font: fontRegular,
      color: textColor,
    });

    if (offer.signingBonus && offer.signingBonus > 0) {
      page.drawText(`• One-time Joining Bonus: ${formatInr(offer.signingBonus)}`, {
        x: 50,
        y: height - 336,
        size: 9.5,
        font: fontRegular,
        color: textColor,
      });
    }

    if (offer.equityShares && offer.equityShares > 0) {
      page.drawText(`• Equity Grants: ${offer.equityShares.toLocaleString()} Units (${offer.equityVestingSchedule})`, {
        x: 50,
        y: height - 352,
        size: 9.5,
        font: fontRegular,
        color: textColor,
      });
    }

    const totalAnnual = offer.baseSalary + (offer.targetBonusPercentage ? (offer.baseSalary * offer.targetBonusPercentage) / 100 : 0);
    page.drawText(`• Total Target Annual Compensation: ${formatInr(totalAnnual)} / annum`, {
      x: 50,
      y: height - 368,
      size: 9.5,
      font: fontBold,
      color: textColor,
    });

    // Terms
    page.drawText('2. Terms of Employment & Statutory Onboarding', {
      x: 40,
      y: height - 400,
      size: 10,
      font: fontBold,
      color: primaryColor,
    });

    const termsText =
      '• Indian Statutory Compliance: Uploading of valid Aadhaar, PAN, EPFO UAN, and Bank verification documents is mandatory.\n' +
      '• Confidentiality: You will execute the company Standard Non-Disclosure Agreement and Code of Conduct.\n' +
      `• Expiration: This offer remains valid for acceptance until ${offer.expirationDate ? new Date(offer.expirationDate).toLocaleDateString('en-US') : '14 days from issue date'}.`;

    page.drawText(termsText, {
      x: 40,
      y: height - 425,
      size: 9,
      font: fontRegular,
      color: textColor,
      lineHeight: 14,
    });

    // Signature Area
    page.drawText('For InfiniteCareers Enterprise:', { x: 40, y: height - 520, size: 9, font: fontBold, color: textColor });
    page.drawText('Candidate Digital Acceptance:', { x: width - 240, y: height - 520, size: 9, font: fontBold, color: textColor });

    page.drawLine({ start: { x: 40, y: height - 570 }, end: { x: 200, y: height - 570 }, thickness: 1, color: mutedColor });
    page.drawLine({ start: { x: width - 240, y: height - 570 }, end: { x: width - 40, y: height - 570 }, thickness: 1, color: mutedColor });

    page.drawText('Authorized Signatory (VP Talent)', { x: 40, y: height - 585, size: 8.5, font: fontRegular, color: mutedColor });
    page.drawText(candidateName, { x: width - 240, y: height - 585, size: 8.5, font: fontRegular, color: mutedColor });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // 2. Upload to S3
    const documentId = crypto.randomUUID();
    const s3Key = buildS3Key({
      tenantId: offer.orgId,
      entityType: 'offers',
      entityId: offer.id,
      category: 'final',
      documentId,
      version: nextVersion,
      filename: `offer-v${nextVersion}.pdf`,
    });

    const { bucket, key, sha256 } = await uploadToS3({
      key: s3Key,
      buffer: pdfBuffer,
      contentType: 'application/pdf',
      metadata: {
        orgId: offer.orgId,
        offerId: offer.id,
        version: String(nextVersion),
        candidateId: offer.candidateId,
      },
    });

    // 3. Save Document Metadata
    const document = await prisma.document.create({
      data: {
        id: documentId,
        orgId: offer.orgId,
        offerId: offer.id,
        candidateId: offer.candidateId,
        applicationId: offer.applicationId,
        documentType: 'OFFER_LETTER',
        documentCategory: 'OFFER',
        originalFilename: `Offer_Letter_${offer.candidate.lastName}_v${nextVersion}.pdf`,
        storedFilename: `offer-v${nextVersion}-${documentId}.pdf`,
        s3Bucket: bucket,
        s3Key: key,
        mimeType: 'application/pdf',
        fileSize: pdfBuffer.length,
        sha256Hash: sha256,
        version: nextVersion,
        status: 'VERIFIED',
        uploadedBy: 'Talent Operations',
      },
    });

    // 4. Update Offer Record
    await prisma.offer.update({
      where: { id: offer.id },
      data: {
        offerLetterContent: bodyText,
      },
    });

    // 5. Cryptographic Audit Log
    await logAuditEvent({
      orgId: offer.orgId,
      actorName: 'Talent Operations',
      actorEmail: 'talent@infinitecareers.com',
      action: 'OFFER_LETTER_GENERATED',
      entityType: 'OFFER',
      entityId: offer.id,
      newState: {
        documentId: document.id,
        version: nextVersion,
        sha256,
        s3Key: key,
        fileSize: pdfBuffer.length,
      },
    });

    return NextResponse.json({
      success: true,
      document,
      version: nextVersion,
      sha256,
      s3Key: key,
    });
  } catch (error: any) {
    console.error('Error generating offer letter:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
