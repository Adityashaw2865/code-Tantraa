/**
 * Server-side port of the frontend's src/services/rulesEngine.ts.
 * This is the authoritative version — eligibility and risk decisions that affect a
 * statutory approval must never be trusted from the client.
 */

function evaluateRequiredApprovals(profile, allApprovals, uploadedDocuments) {
  const uploadedDocKeys = new Set(
    uploadedDocuments
      .filter((d) => d.verificationStatus === 'verified' || d.verificationStatus === 'under_verification')
      .map((d) => d.documentKey)
  );

  return allApprovals.map((approval) => {
    const reasons = [];
    let isApplicable = true;
    let confidence = 'Likely Required';

    // 1. Sector check
    if (approval.applicableSectors !== 'All') {
      if (!approval.applicableSectors.includes(profile.industrySector)) {
        isApplicable = false;
        confidence = 'Not Applicable';
        reasons.push(`Sector '${profile.industrySector}' does not fall under ${approval.approvalName} statutory mandate.`);
      } else {
        reasons.push(`Mandatory for ${profile.industrySector} industrial classification.`);
      }
    }

    // 2. Employee threshold check
    if (isApplicable && approval.minEmployees !== undefined && approval.minEmployees !== null) {
      if (profile.numberOfEmployees >= approval.minEmployees) {
        reasons.push(
          `Unit employs ${profile.numberOfEmployees} workers, exceeding statutory threshold of ${approval.minEmployees} under ${approval.legalActReference || 'applicable law'}.`
        );
      } else {
        confidence = 'Not Applicable';
        isApplicable = false;
        reasons.push(`Unit employs ${profile.numberOfEmployees} workers, which is below the threshold of ${approval.minEmployees}.`);
      }
    }

    // 3. Pollution / environmental category check
    if (isApplicable && approval.pollutionCategories && approval.pollutionCategories.length > 0) {
      if (approval.pollutionCategories.includes(profile.environmentalCategory)) {
        reasons.push(
          `Unit is classified under '${profile.environmentalCategory}' pollution category by CPCB/SPCB with industrial effluent discharge.`
        );
      } else if (profile.environmentalCategory === 'White') {
        confidence = 'Not Applicable';
        isApplicable = false;
        reasons.push('White category industries are exempt from Consent under State Pollution Board circulars.');
      } else {
        confidence = 'Needs Department Confirmation';
        reasons.push(`Category '${profile.environmentalCategory}' requires specific zonal confirmation by SPCB.`);
      }
    }

    // 4. Boiler-linked approvals
    if (isApplicable && approval.requiresBoiler && !profile.boilerInstallationRequired) {
      confidence = 'Not Applicable';
      isApplicable = false;
      reasons.push('No boiler installation declared for this unit.');
    } else if (isApplicable && approval.requiresBoiler && profile.boilerInstallationRequired) {
      reasons.push('Presence of steam boiler requires integrated safety clearance with Directorate of Boilers.');
    }

    // 5. Hazardous-materials-linked approvals
    if (isApplicable && approval.requiresHazardous && !profile.hazardousMaterialsPresent) {
      confidence = 'Not Applicable';
      isApplicable = false;
      reasons.push('No hazardous materials declared for this unit.');
    } else if (isApplicable && approval.requiresHazardous && profile.hazardousMaterialsPresent) {
      reasons.push('Hazardous materials handling triggers mandatory safety clearance.');
    }

    // 6. Minimum investment threshold
    if (isApplicable && approval.minInvestmentCr !== undefined && approval.minInvestmentCr !== null) {
      if (profile.investmentAmountCr < approval.minInvestmentCr) {
        confidence = 'Not Applicable';
        isApplicable = false;
        reasons.push(`Investment of ₹${profile.investmentAmountCr}Cr is below the ₹${approval.minInvestmentCr}Cr threshold.`);
      }
    }

    const prerequisiteNames = (approval.prerequisiteApprovalIds || []).map((id) => {
      const match = allApprovals.find((a) => String(a._id) === String(id));
      return match ? match.approvalName : String(id);
    });

    const parallelNames = (approval.parallelApprovalIds || []).map((id) => {
      const match = allApprovals.find((a) => String(a._id) === String(id));
      return match ? match.approvalName : String(id);
    });

    const requiredKeys = approval.requiredDocumentKeys || [];
    const availableCount = requiredKeys.filter((k) => uploadedDocKeys.has(k)).length;
    const missingCount = requiredKeys.length - availableCount;
    const readinessPercentage = requiredKeys.length > 0 ? Math.round((availableCount / requiredKeys.length) * 100) : 100;

    const readinessStatus = missingCount > 0 ? 'Needs Documents' : 'Ready to Submit';

    return {
      approval,
      confidence,
      isApplicable,
      reasons,
      prerequisiteNames,
      parallelNames,
      isPreOperationMandatory: approval.isMandatoryPreOperation,
      missingDocumentsCount: missingCount,
      availableDocumentsCount: availableCount,
      readinessPercentage,
      readinessStatus
    };
  });
}

function calculateApplicationRisk(profile, missingDocsCount) {
  const factors = [];
  let score = 0;

  if (profile.environmentalCategory === 'Red') {
    score += 40;
    factors.push('CPCB Red Category classification — high hazardous effluent potential');
  } else if (profile.environmentalCategory === 'Orange') {
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
  return {
    riskLevel,
    riskFactors: factors.length > 0 ? factors : ['Standard compliance profile with all baseline documents verified']
  };
}

module.exports = { evaluateRequiredApprovals, calculateApplicationRisk };
