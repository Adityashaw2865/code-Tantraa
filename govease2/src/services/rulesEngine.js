export function evaluateRequiredApprovals(profile, allApprovals, uploadedDocuments) {
    const uploadedDocKeys = new Set(uploadedDocuments
        .filter(d => d.verificationStatus === 'verified' || d.verificationStatus === 'under_verification')
        .map(d => d.documentKey));
    return allApprovals.map(approval => {
        const reasons = [];
        let isApplicable = true;
        let confidence = 'Likely Required';
        // 1. Sector Check
        if (approval.applicableSectors !== 'All') {
            if (!approval.applicableSectors.includes(profile.industrySector)) {
                isApplicable = false;
                confidence = 'Not Applicable';
                reasons.push(`Sector '${profile.industrySector}' does not fall under ${approval.approvalName} statutory mandate.`);
            }
            else {
                reasons.push(`Mandatory for ${profile.industrySector} industrial classification.`);
            }
        }
        // 2. Employee threshold check (e.g. Factories Act, Contract Labour)
        if (isApplicable && approval.minEmployees !== undefined) {
            if (profile.numberOfEmployees >= approval.minEmployees) {
                reasons.push(`Unit employs ${profile.numberOfEmployees} workers, exceeding statutory threshold of ${approval.minEmployees} under ${approval.legalActReference}.`);
            }
            else {
                confidence = 'Not Applicable';
                isApplicable = false;
                reasons.push(`Unit employs ${profile.numberOfEmployees} workers, which is below the threshold of ${approval.minEmployees}.`);
            }
        }
        // 3. Pollution / Environmental Category Check
        if (isApplicable && approval.pollutionCategories && approval.pollutionCategories.length > 0) {
            if (approval.pollutionCategories.includes(profile.environmentalCategory)) {
                reasons.push(`Unit is classified under '${profile.environmentalCategory}' pollution category by CPCB/SPCB with industrial effluent discharge.`);
            }
            else {
                if (profile.environmentalCategory === 'White') {
                    confidence = 'Not Applicable';
                    isApplicable = false;
                    reasons.push(`White category industries are exempt from Consent under State Pollution Board circulars.`);
                }
                else {
                    confidence = 'Needs Department Confirmation';
                    reasons.push(`Category '${profile.environmentalCategory}' requires specific zonal confirmation by SPCB.`);
                }
            }
        }
        // 4. Power Load / Boiler checks
        if (isApplicable && approval.id === 'appr_power_sanction') {
            if (profile.connectedPowerLoadKVA >= 50) {
                reasons.push(`Contracted load of ${profile.connectedPowerLoadKVA} kVA exceeds the 50 kVA HT industrial connection threshold.`);
            }
            else {
                confidence = 'Potentially Required';
                reasons.push(`Standard LT connection may suffice; confirm with local power division.`);
            }
        }
        if (isApplicable && approval.id === 'appr_factory_licence' && profile.boilerInstallationRequired) {
            reasons.push(`Presence of steam baby boiler requires integrated safety clearance with Directorate of Boilers.`);
        }
        // 5. Land & Building Check
        if (isApplicable && approval.id === 'appr_building_plan') {
            reasons.push(`Built-up area of ${profile.builtUpAreaSqFt.toLocaleString()} sq. ft. requires structural and fire setback vetting.`);
        }
        // Map prerequisites
        const prerequisiteNames = approval.prerequisiteApprovalIds
            .map(id => allApprovals.find(a => a.id === id)?.approvalName || id);
        const parallelNames = approval.parallelApprovalIds
            .map(id => allApprovals.find(a => a.id === id)?.approvalName || id);
        // Document readiness check
        const requiredKeys = approval.requiredDocumentKeys;
        const availableCount = requiredKeys.filter(k => uploadedDocKeys.has(k)).length;
        const missingCount = requiredKeys.length - availableCount;
        const readinessPercentage = requiredKeys.length > 0
            ? Math.round((availableCount / requiredKeys.length) * 100)
            : 100;
        let readinessStatus = 'Ready to Submit';
        if (missingCount > 0) {
            readinessStatus = 'Needs Documents';
        }
        return {
            approval,
            confidence,
            reasons,
            prerequisiteNames,
            parallelNames,
            isPreOperationMandatory: approval.isMandatoryPreOperation,
            isUnlocked: true,
            missingDocumentsCount: missingCount,
            availableDocumentsCount: availableCount,
            readinessPercentage,
            readinessStatus
        };
    });
}
/**
 * Computes Risk Score based on environmental, scale and completeness variables
 */
export function calculateApplicationRisk(approval, profile, missingDocsCount) {
    const factors = [];
    let score = 0;
    if (profile.environmentalCategory === 'Red') {
        score += 40;
        factors.push('CPCB Red Category classification — high hazardous effluent potential');
    }
    else if (profile.environmentalCategory === 'Orange') {
        score += 20;
        factors.push('CPCB Orange Category — industrial washing and effluent treatment monitoring');
    }
    if (profile.boilerInstallationRequired) {
        score += 15;
        factors.push('Pressurized steam boiler installation requires thermal safety scrutiny');
    }
    if (profile.investmentAmountCr >= 10) {
        score += 15;
        factors.push('Large investment scale (₹10Cr+) mandates multi-department scrutiny');
    }
    if (missingDocsCount > 0) {
        score += missingDocsCount * 10;
        factors.push(`${missingDocsCount} mandatory statutory document(s) still unverified or absent`);
    }
    if (profile.numberOfEmployees >= 40) {
        score += 10;
        factors.push('High workforce density (40+ personnel) requires stringent life safety and egress validation');
    }
    const riskLevel = score >= 50 ? 'High' : score >= 25 ? 'Medium' : 'Low';
    return { riskLevel, riskFactors: factors.length > 0 ? factors : ['Standard compliance profile with all baseline documents verified'] };
}
