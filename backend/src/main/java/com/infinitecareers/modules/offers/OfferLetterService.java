package com.infinitecareers.modules.offers;

import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.common.events.TransactionalOutboxService;
import com.infinitecareers.modules.audit.AuditLogService;
import com.infinitecareers.modules.documents.Document;
import com.infinitecareers.modules.documents.DocumentRepository;
import com.infinitecareers.modules.documents.DocumentStorageService;
import com.infinitecareers.modules.documents.S3ObjectKeyService;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class OfferLetterService {

    private static final Logger log = LoggerFactory.getLogger(OfferLetterService.class);

    private final OfferRepository offerRepository;
    private final DocumentRepository documentRepository;
    private final DocumentStorageService documentStorageService;
    private final S3ObjectKeyService s3ObjectKeyService;
    private final AuditLogService auditLogService;
    private final TransactionalOutboxService transactionalOutboxService;

    public OfferLetterService(
            OfferRepository offerRepository,
            DocumentRepository documentRepository,
            DocumentStorageService documentStorageService,
            S3ObjectKeyService s3ObjectKeyService,
            AuditLogService auditLogService,
            TransactionalOutboxService transactionalOutboxService) {
        this.offerRepository = offerRepository;
        this.documentRepository = documentRepository;
        this.documentStorageService = documentStorageService;
        this.s3ObjectKeyService = s3ObjectKeyService;
        this.auditLogService = auditLogService;
        this.transactionalOutboxService = transactionalOutboxService;
    }

    @Transactional
    public Document generateAndStoreOfferLetter(String offerId, Map<String, Object> contextualDetails) {
        String tenantId = TenantContextHolder.getTenantId();
        Offer offer = offerRepository.findByIdAndTenantId(offerId, tenantId)
                .orElseThrow(() -> new NoSuchElementException("Offer not found: " + offerId));

        // Determine version
        List<Document> existingDocs = documentRepository.findByTenantIdAndOfferId(tenantId, offerId);
        int nextVersion = existingDocs.stream().mapToInt(d -> d.getVersion() != null ? d.getVersion() : 1).max().orElse(0) + 1;

        // 1. Generate PDF Bytes
        byte[] pdfBytes = renderOfferLetterPdf(offer, contextualDetails, nextVersion);

        // 2. Compute SHA-256
        String sha256 = documentStorageService.calculateSha256(pdfBytes);
        String documentId = UUID.randomUUID().toString();

        // 3. Construct S3 Key
        String s3Key = s3ObjectKeyService.buildOfferDocumentKey(tenantId, offerId, "final", nextVersion, documentId);

        // 4. Upload to S3
        Map<String, String> s3Metadata = Map.of(
                "tenantId", tenantId,
                "offerId", offerId,
                "version", String.valueOf(nextVersion),
                "sha256", sha256
        );
        documentStorageService.upload(s3Key, pdfBytes, "application/pdf", s3Metadata);

        // 5. Store Document Metadata in PostgreSQL
        Document doc = new Document();
        doc.setId(documentId);
        doc.setTenantId(tenantId);
        doc.setOfferId(offerId);
        doc.setApplicationId(offer.getApplicationId());
        doc.setOwnerId(offer.getApplicationId());
        doc.setDocumentType("OFFER_LETTER");
        doc.setDocumentCategory("OFFER");
        doc.setOriginalFilename(String.format("Offer_Letter_v%d.pdf", nextVersion));
        doc.setStoredFilename(String.format("offer-v%d-%s.pdf", nextVersion, documentId));
        doc.setMimeType("application/pdf");
        doc.setStorageKey(s3Key);
        doc.setS3Key(s3Key);
        doc.setS3Bucket("infiniteatsbucket");
        doc.setFileSize((long) pdfBytes.length);
        doc.setSha256Hash(sha256);
        doc.setVersion(nextVersion);
        doc.setStatus("VERIFIED");
        doc.setUploadedById(TenantContextHolder.getUserId());
        doc.setUploadedBy(TenantContextHolder.getContext() != null && TenantContextHolder.getContext().getUserEmail() != null 
                ? TenantContextHolder.getContext().getUserEmail() : "system@infinitecareers.com");
        Document savedDoc = documentRepository.save(doc);

        // 6. Update Offer Record Reference
        offer.setOfferLetterUrl("/api/v1/documents/" + savedDoc.getId() + "/download");
        offerRepository.save(offer);

        // 7. Audit Log with SHA-256 Hash
        String auditPayload = String.format("{\"documentId\":\"%s\",\"version\":%d,\"sha256\":\"%s\",\"s3Key\":\"%s\"}",
                savedDoc.getId(), nextVersion, sha256, s3Key);
        auditLogService.record("OFFER_LETTER_GENERATED", "OFFER", offerId, null, auditPayload);

        // 8. Transactional Outbox Event
        transactionalOutboxService.publish("OFFER_LETTER_GENERATED", "OFFER", offerId, Map.of(
                "documentId", savedDoc.getId(),
                "offerId", offerId,
                "version", nextVersion,
                "sha256", sha256,
                "s3Key", s3Key,
                "fileSize", pdfBytes.length
        ));

        log.info("Successfully generated and stored versioned offer letter in S3: offerId={}, version={}, sha256={}",
                offerId, nextVersion, sha256);

        return savedDoc;
    }

    private byte[] renderOfferLetterPdf(Offer offer, Map<String, Object> details, int version) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(); // Note: OpenPDF com.lowagie.text.Document
            com.lowagie.text.Document pdfDoc = new com.lowagie.text.Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(pdfDoc, out);
            pdfDoc.open();

            // Fonts
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Font.NORMAL);
            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.NORMAL);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.NORMAL);
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.NORMAL);
            Font italicFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, Font.NORMAL);

            // 1. Company Header
            String companyName = details != null && details.containsKey("companyName")
                    ? String.valueOf(details.get("companyName")) : "InfiniteCareers Enterprise Labs India Pvt. Ltd.";
            String companyAddress = details != null && details.containsKey("companyAddress")
                    ? String.valueOf(details.get("companyAddress")) : "Mindspace IT Park, Building No. 12B, HITEC City, Hyderabad, Telangana 500081";

            Paragraph pCompany = new Paragraph(companyName, headerFont);
            pCompany.setAlignment(Element.ALIGN_CENTER);
            pdfDoc.add(pCompany);

            Paragraph pAddr = new Paragraph(companyAddress, italicFont);
            pAddr.setAlignment(Element.ALIGN_CENTER);
            pAddr.setSpacingAfter(15);
            pdfDoc.add(pAddr);

            // Divider
            Paragraph divider = new Paragraph("________________________________________________________________________________");
            divider.setSpacingAfter(15);
            pdfDoc.add(divider);

            // 2. Metadata: Date & Offer Ref
            String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
            String candidateName = details != null && details.containsKey("candidateName")
                    ? String.valueOf(details.get("candidateName")) : "Valued Candidate";
            String candidateAddress = details != null && details.containsKey("candidateAddress")
                    ? String.valueOf(details.get("candidateAddress")) : "Bengaluru, India";
            String positionTitle = details != null && details.containsKey("title")
                    ? String.valueOf(details.get("title")) : "Staff Software Engineer";
            String department = details != null && details.containsKey("department")
                    ? String.valueOf(details.get("department")) : "Engineering & Core Platform";
            String location = details != null && details.containsKey("location")
                    ? String.valueOf(details.get("location")) : "Hyderabad, India (Hybrid)";

            pdfDoc.add(new Paragraph("Date: " + dateStr, regularFont));
            pdfDoc.add(new Paragraph(String.format("Offer Reference: OFF-%s (Version %d)", offer.getId().substring(0, 8).toUpperCase(), version), boldFont));
            pdfDoc.add(new Paragraph("\nTo,", regularFont));
            pdfDoc.add(new Paragraph(candidateName, boldFont));
            pdfDoc.add(new Paragraph(candidateAddress, regularFont));
            pdfDoc.add(new Paragraph("\nSubject: Formal Letter of Employment Offer\n", boldFont));

            // 3. Body Opening
            String intro = String.format("Dear %s,\n\nWe are pleased to offer you the full-time position of %s within our %s department at %s. We were exceptionally impressed by your technical mastery, architectural insights, and interview performance.\n\nYour proposed joining date will be %s.",
                    candidateName, positionTitle, department, location,
                    offer.getStartDate() != null ? offer.getStartDate().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")) : "Mutually agreed date");
            pdfDoc.add(new Paragraph(intro, regularFont));

            // 4. Compensation Table
            pdfDoc.add(new Paragraph("\n1. Compensation Structure", subHeaderFont));
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setSpacingBefore(8);
            table.setSpacingAfter(12);

            addTableRow(table, "Component", "Annual Amount (" + offer.getCurrency() + ")", boldFont, true);
            addTableRow(table, "Annual Base CTC", formatCurrency(offer.getBaseSalary(), offer.getCurrency()), regularFont, false);
            if (offer.getBonusAmount() != null && offer.getBonusAmount().compareTo(BigDecimal.ZERO) > 0) {
                addTableRow(table, "Target Performance Bonus", formatCurrency(offer.getBonusAmount(), offer.getCurrency()), regularFont, false);
            }
            if (offer.getEquityGrant() != null && !offer.getEquityGrant().trim().isEmpty()) {
                addTableRow(table, "Equity / Stock Grant", offer.getEquityGrant(), regularFont, false);
            }
            BigDecimal totalCtc = offer.getBaseSalary().add(offer.getBonusAmount() != null ? offer.getBonusAmount() : BigDecimal.ZERO);
            addTableRow(table, "Total Guaranteed & Target CTC", formatCurrency(totalCtc, offer.getCurrency()), boldFont, false);
            pdfDoc.add(table);

            // 5. Terms & Conditions
            pdfDoc.add(new Paragraph("2. Employment Terms & Statutory Compliance", subHeaderFont));
            String terms = "• Probation Period: 3 months from the effective joining date.\n" +
                    "• Indian Statutory Onboarding: Verification of Aadhaar, PAN, EPFO UAN registration, and Form 11 is mandatory prior to commencement of duties.\n" +
                    "• Confidentiality: You will execute our standard Employee Proprietary Information and Inventions Agreement (PIIA).\n" +
                    "• Offer Validity: This formal offer is valid until " +
                    (offer.getExpirationDate() != null ? offer.getExpirationDate().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")) : "14 days from issue date") + ".";
            pdfDoc.add(new Paragraph(terms, regularFont));

            // 6. Signatures
            pdfDoc.add(new Paragraph("\n\nAccepted and Agreed:", boldFont));
            PdfPTable sigTable = new PdfPTable(2);
            sigTable.setWidthPercentage(100);
            sigTable.setSpacingBefore(15);

            PdfPCell c1 = new PdfPCell(new Paragraph("For InfiniteCareers Enterprise:\n\n\n_______________________\nAuthorized Signatory\nTalent Operations", regularFont));
            c1.setBorder(Rectangle.NO_BORDER);
            PdfPCell c2 = new PdfPCell(new Paragraph("Candidate Acceptance:\n\n\n_______________________\nSignature: " + candidateName + "\nDate: ____________", regularFont));
            c2.setBorder(Rectangle.NO_BORDER);
            sigTable.addCell(c1);
            sigTable.addCell(c2);
            pdfDoc.add(sigTable);

            pdfDoc.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to render offer letter PDF for offerId={}", offer.getId(), e);
            throw new RuntimeException("Offer letter PDF rendering failed: " + e.getMessage(), e);
        }
    }

    private void addTableRow(PdfPTable table, String col1, String col2, Font font, boolean isHeader) {
        PdfPCell c1 = new PdfPCell(new Phrase(col1, font));
        PdfPCell c2 = new PdfPCell(new Phrase(col2, font));
        if (isHeader) {
            c1.setBackgroundColor(new java.awt.Color(240, 244, 248));
            c2.setBackgroundColor(new java.awt.Color(240, 244, 248));
        }
        c1.setPadding(6);
        c2.setPadding(6);
        table.addCell(c1);
        table.addCell(c2);
    }

    private String formatCurrency(BigDecimal amount, String currency) {
        if (amount == null) return "0.00";
        NumberFormat format = NumberFormat.getNumberInstance(new Locale("en", "IN"));
        return String.format("%s %s", currency != null ? currency : "INR", format.format(amount));
    }
}
