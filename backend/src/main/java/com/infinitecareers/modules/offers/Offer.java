package com.infinitecareers.modules.offers;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "offers")
public class Offer extends BaseTenantEntity {

    @Column(name = "application_id", nullable = false)
    private String applicationId;

    @Column(name = "base_salary", precision = 15, scale = 2, nullable = false)
    private BigDecimal baseSalary;

    @Column(name = "bonus_amount", precision = 15, scale = 2)
    private BigDecimal bonusAmount = BigDecimal.ZERO;

    @Column(name = "equity_grant")
    private String equityGrant;

    @Column(name = "currency")
    private String currency = "USD";

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "expiration_date", nullable = false)
    private LocalDate expirationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OfferState status = OfferState.DRAFT;

    @Column(name = "offer_letter_url")
    private String offerLetterUrl;

    @Column(name = "signed_document_url")
    private String signedDocumentUrl;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "created_by")
    private String createdBy;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "offer_id")
    private List<OfferComponent> components = new ArrayList<>();

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
    public BigDecimal getBaseSalary() { return baseSalary; }
    public void setBaseSalary(BigDecimal baseSalary) { this.baseSalary = baseSalary; }
    public BigDecimal getBonusAmount() { return bonusAmount; }
    public void setBonusAmount(BigDecimal bonusAmount) { this.bonusAmount = bonusAmount; }
    public String getEquityGrant() { return equityGrant; }
    public void setEquityGrant(String equityGrant) { this.equityGrant = equityGrant; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getExpirationDate() { return expirationDate; }
    public void setExpirationDate(LocalDate expirationDate) { this.expirationDate = expirationDate; }
    public OfferState getStatus() { return status; }
    public void setStatus(OfferState status) { this.status = status; }
    public String getOfferLetterUrl() { return offerLetterUrl; }
    public void setOfferLetterUrl(String offerLetterUrl) { this.offerLetterUrl = offerLetterUrl; }
    public String getSignedDocumentUrl() { return signedDocumentUrl; }
    public void setSignedDocumentUrl(String signedDocumentUrl) { this.signedDocumentUrl = signedDocumentUrl; }
    public Instant getSignedAt() { return signedAt; }
    public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public List<OfferComponent> getComponents() { return components; }
    public void setComponents(List<OfferComponent> components) { this.components = components; }
}
