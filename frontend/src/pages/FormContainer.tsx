import React, { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';

// 使用 React.FC 类型来确保组件接收 props
type LazyComponent = React.LazyExoticComponent<React.FC<object>>;

// 使用 lazy loading 动态导入表单组件
// 路径必须是字面量，不能是变量
const formMap: { [key: string]: LazyComponent } = {
// ==========================================claim=======================================================
'claim-labor-dispute': lazy(() => import('../forms/claim/LaborDisputeClaimFormPage')),
'claim-unfair-competition': lazy(() => import('../forms/claim/UnfairCompetitionClaimFormPage')),
'claim-sales-contract': lazy(() => import('../forms/claim/SalesContractClaimFormPage')),
'claim-financial-loan-contract': lazy(() => import('../forms/claim/FinancialLoanClaimFormPage')),
'claim-private-lending': lazy(() => import('../forms/claim/PrivateLendingClaimFormPage')),
'claim-construction-contract': lazy(() => import('../forms/claim/ConstructionContractClaimFormPage')),
'claim-housing-sales-contract': lazy(() => import('../forms/claim/HousingSalesContractClaimFormPage')),
'claim-credit-card': lazy(() => import('../forms/claim/CreditCardDisputeClaimFormPage')),
'claim-housing-lease': lazy(() => import('../forms/claim/HousingLeaseClaimFormPage')),
// 'claim-financial-leasing-contract': lazy(() => import('../forms/claim/FinancialLeasingContractClaimFormPage')),
'claim-property-management-contract': lazy(() => import('../forms/claim/PropertyManagementContractClaimFormPage')),
// 'claim-securities-misrepresentation': lazy(() => import('../forms/claim/SecuritiesMisrepresentationClaimFormPage')),
// 'claim-property-damage-insurance': lazy(() => import('../forms/claim/PropertyDamageInsuranceClaimFormPage')),
// 'claim-liability-insurance': lazy(() => import('../forms/claim/LiabilityInsuranceClaimFormPage')),
// 'claim-guarantee-insurance': lazy(() => import('../forms/claim/GuaranteeInsuranceClaimFormPage')),
// 'claim-personal-insurance': lazy(() => import('../forms/claim/PersonalInsuranceClaimFormPage')),
'claim-traffic-accident': lazy(() => import('../forms/claim/TrafficAccidentClaimFormPage')),
// 'claim-copyright-infringement': lazy(() => import('../forms/claim/CopyrightInfringementClaimFormPage')),
// 'claim-trademark-infringement': lazy(() => import('../forms/claim/TrademarkInfringementClaimFormPage')),
// 'claim-invention-patent-infringement': lazy(() => import('../forms/claim/InventionPatentInfringementClaimFormPage')),
// 'claim-design-patent-infringement': lazy(() => import('../forms/claim/DesignPatentInfringementClaimFormPage')),
// 'claim-plant-variety-rights-infringement': lazy(() => import('../forms/claim/PlantVarietyRightsInfringementClaimFormPage')),
// 'claim-trade-secret-infringement': lazy(() => import('../forms/claim/TradeSecretInfringementClaimFormPage')),
// 'claim-technology-contract': lazy(() => import('../forms/claim/TechnologyContractClaimFormPage')),
'claim-divorce': lazy(() => import('../forms/claim/DivorceClaimFormPage')),
// 'claim-monopoly-dispute': lazy(() => import('../forms/claim/MonopolyDisputeClaimFormPage')),
// 'claim-ship-collision-damage': lazy(() => import('../forms/claim/ShipCollisionDamageClaimFormPage')),
// 'claim-maritime-personal-injury': lazy(() => import('../forms/claim/MaritimePersonalInjuryClaimFormPage')),
// 'claim-maritime-freight-forwarding': lazy(() => import('../forms/claim/MaritimeFreightForwardingClaimFormPage')),
// 'claim-seafarer-labor-contract': lazy(() => import('../forms/claim/SeafarerLaborContractClaimFormPage')),
// 'claim-environmental-pollution-public-interest': lazy(() => import('../forms/claim/EnvironmentalPollutionPublicInterestClaimFormPage')),
// 'claim-ecological-damage-public-interest': lazy(() => import('../forms/claim/EcologicalDamagePublicInterestClaimFormPage')),
// 'claim-environmental-damage-compensation': lazy(() => import('../forms/claim/EnvironmentalDamageCompensationClaimFormPage')),


// ==========================================defense=======================================================
    'defense-construction-contract': lazy(() => import('../forms/defense/ConstructionContractDefenseFormPage.tsx')),
  'defense-copyright-infringement': lazy(() => import('../forms/defense/CopyrightInfringementDefenseFormPage.tsx')),
  'defense-credit-card': lazy(() => import('../forms/defense/CreditCardDefenseFormPage.tsx')),
  'defense-design-patent-infringement': lazy(() => import('../forms/defense/DesignPatentInfringementDefenseFormPage.tsx')),
  'defense-divorce': lazy(() => import('../forms/defense/DivorceDefenseFormPage.tsx')),
  'defense-ecological-damage-public-interest': lazy(() => import('../forms/defense/EcologicalDamagePublicInterestDefenseFormPage.tsx')),
  'defense-environmental-damage-compensation': lazy(() => import('../forms/defense/EnvironmentalDamageCompensationDefenseFormPage.tsx')),
  'defense-environmental-pollution-public-interest': lazy(() => import('../forms/defense/EnvironmentalPollutionPublicInterestDefenseFormPage.tsx')),
  'defense-financial-leasing-contract': lazy(() => import('../forms/defense/FinancialLeasingContractDefenseFormPage.tsx')),
  'defense-guarantee-insurance': lazy(() => import('../forms/defense/GuaranteeInsuranceDefenseFormPage.tsx')),
  'defense-housing-lease': lazy(() => import('../forms/defense/HousingLeaseDefenseFormPage.tsx')),
  'defense-housing-sales-contract': lazy(() => import('../forms/defense/HousingSalesContractDefenseFormPage.tsx')),
  'defense-invention-patent-infringement': lazy(() => import('../forms/defense/InventionPatentInfringementDefenseFormPage.tsx')),
  'defense-labor-dispute': lazy(() => import('../forms/defense/LaborDisputeDefenseFormPage.tsx')),
  'defense-liability-insurance': lazy(() => import('../forms/defense/LiabilityInsuranceDefenseFormPage.tsx')),
  'defense-maritime-freight-forwarding': lazy(() => import('../forms/defense/MaritimeFreightForwardingDefenseFormPage.tsx')),
  'defense-maritime-personal-injury': lazy(() => import('../forms/defense/MaritimePersonalInjuryDefenseFormPage.tsx')),
  'defense-monopoly-dispute': lazy(() => import('../forms/defense/MonopolyDisputeDefenseFormPage.tsx')),
  'defense-personal-insurance': lazy(() => import('../forms/defense/PersonalInsuranceDefenseFormPage.tsx')),
  'defense-plant-variety-rights-infringement': lazy(() => import('../forms/defense/PlantVarietyRightsInfringementDefenseFormPage.tsx')),
  'defense-private-lending': lazy(() => import('../forms/defense/PrivateLendingDefenseFormPage.tsx')),
  'defense-property-damage-insurance': lazy(() => import('../forms/defense/PropertyDamageInsuranceDefenseFormPage.tsx')),
  'defense-property-management-contract': lazy(() => import('../forms/defense/PropertyManagementContractDefenseFormPage.tsx')),
  'defense-sales-contract': lazy(() => import('../forms/defense/SalesContractDefenseFormPage.tsx')),
  'defense-seafarer-labor-contract': lazy(() => import('../forms/defense/SeafarerLaborContractDefenseFormPage.tsx')),
  'defense-securities-misrepresentation': lazy(() => import('../forms/defense/SecuritiesMisrepresentationDefenseFormPage.tsx')),
  'defense-ship-collision-damage': lazy(() => import('../forms/defense/ShipCollisionDamageDefenseFormPage.tsx')),
  'defense-technology-contract': lazy(() => import('../forms/defense/TechnologyContractDefenseFormPage.tsx')),
  'defense-trademark-infringement': lazy(() => import('../forms/defense/TrademarkInfringementDefenseFormPage.tsx')),
  'defense-trade-secret-infringement': lazy(() => import('../forms/defense/TradeSecretInfringementDefenseFormPage.tsx')),
  'defense-traffic-accident': lazy(() => import('../forms/defense/TrafficAccidentDefenseFormPage.tsx')),
  'defense-unfair-competition': lazy(() => import('../forms/defense/UnfairCompetitionDefenseFormPage.tsx')),
  'defense-financial-loan-contract': lazy(() => import('../forms/defense/FinancialLoanDefenseFormPage.tsx')),


};


export const FormContainer: React.FC = () => {
    const { docType, formName } = useParams<{ docType: string, formName: string }>();
    const formKey = `${docType}-${formName}`;

    const FormComponent = formMap[formKey];

    if (!FormComponent) {
        return <div className="p-8 text-center text-error">未找到对应的表单模板: {formKey}</div>;
    }

    return (
        // Suspense 是 lazy loading 的必需品，用于在组件加载时显示后备内容
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>}>
            <FormComponent />
        </Suspense>
    );
};