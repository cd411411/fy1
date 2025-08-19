// src/components/defense/GenericDefenseFormPage.tsx (完整且已修复所有问题)

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FormPageLayout } from "../../layouts/FormPageLayout";
import { FormSectionCard } from "../../layouts/FormSectionCard";
import { BasicInfoSection } from "../BasicInfoSection";
import { PartyList } from "../../layouts/PartyList";
import { AgentList } from "../../layouts/AgentList";
import { MediationForm } from "../MediationForm";
import { ClaimInfoPanel } from "../ClaimInfoPanel";
import { AIChatbotPanel } from "../AIChatbotPanel";
// import { generateAndDownloadDocx } from "../../api/documentApi";
import { createGenericFormDataProcessor } from "../../utils/defense-form.utils";
import { GenericDefenseItemsSection } from "./GenericDefenseItemsSection";
import { GenericFactsAndReasonsSection } from "./GenericFactsAndReasonsSection";
import type { GenericDefenseFormPageProps } from "../../interfaces/defense-form.types";
import type { FinalDataObject, QuestionListItem } from "../../interfaces/document.types";
import eventBus from '../../utils/events';

export const GenericDefenseFormPage: React.FC<GenericDefenseFormPageProps> = ({
  config,
  rightPanel,
  additionalSections
}) => {
  const processFormDataForPreview = createGenericFormDataProcessor(config);
  
  const location = useLocation();
  const loadedFormData = location.state?.loadedFormData;
  const initialCaseNumber = loadedFormData?.basicInfo?.caseNumber || null;
  const initialDefendantCode = loadedFormData?.basicInfo?.defendantCode || null;

  const [plaintiffFullText, setPlaintiffFullText] = useState<string>('');
  const [plaintiffClaims, setPlaintiffClaims] = useState<QuestionListItem[]>([]);
  const [plaintiffFacts, setPlaintiffFacts] = useState<QuestionListItem[]>([]);

  // (补全) 完整的 handleFormSubmit 函数
  const handleFormSubmit = async (data: any) => {
    const normalizedData = {
      ...data,
      facts: data.facts || {}
    };
    
    const final = processFormDataForPreview(normalizedData);
    const payload = { formData: normalizedData, final };
    
    console.log(`最终提交的答辩状Payload (${config.caseType}):`, JSON.stringify(payload, null, 2));
    
    // generateAndDownloadDocx 是在 FormPageLayout 中被调用的，
    // onSubmit 的作用是处理数据，而不是直接调用下载。
    // 这个函数在这里实际上是空的，因为逻辑都在 FormPageLayout 的 onConfirm 中。
    // 为了清晰，我们保留它，但实际工作由 FormPageLayout 完成。
    // 如果您有特殊的提交逻辑（例如，除了下载还想做别的事情），可以写在这里。
  };
  
  useEffect(() => {
    const handleClaimData = (data: FinalDataObject | null) => { 
        if (data) {
            const claims = data.claimItems || [];
            const facts = data.factItems || [];
            setPlaintiffClaims(claims);
            setPlaintiffFacts(facts);

            const claimsText = claims.map((item: QuestionListItem) => `${item.question}\n${item.answers}`).join('\n\n');
            const factsText = facts.map((item: QuestionListItem) => `${item.question}\n${item.answers}`).join('\n\n');
            const fullText = `【原告诉讼请求】\n${claimsText}\n\n--------------------\n\n【原告主张的事实与理由】\n${factsText}`.trim();
            setPlaintiffFullText(fullText);
        } else {
            setPlaintiffClaims([]);
            setPlaintiffFacts([]);
            setPlaintiffFullText('');
        }
    };

    eventBus.on('claimDataLoaded', handleClaimData);
    return () => {
        eventBus.off('claimDataLoaded', handleClaimData);
    };
  }, []);

  const leftPanel = (
    <ClaimInfoPanel 
      initialCaseNumber={initialCaseNumber}
      initialDefendantCode={initialDefendantCode}
      currentCaseCause={config.caseType}
    />
  );
  
  const defaultRightPanel = <AIChatbotPanel />;

  const shouldShowFactsAndReasons = config.showFactsAndReasons !== false && 
                                   config.factsAndReasonsConfig && 
                                   config.factsAndReasonsConfig.length > 0;

  return (
    <FormPageLayout
      title={config.title}
      formId={`defense_${config.formId}`}
      onSubmit={handleFormSubmit}
      onPreviewData={processFormDataForPreview}
      leftPanel={leftPanel}
      rightPanel={rightPanel || defaultRightPanel}
      docType="答辩状"
      fixedFormValues={{basicInfo: {caseCause: config.caseType}}}
    >
      <BasicInfoSection case_type={config.caseType} formId={`defense_${config.formId}`} />
      
      <FormSectionCard title="答辩人信息">
        <PartyList path="defendants_natural" title="自然人" partyType="natural" />
        <div className="divider my-4"></div>
        <PartyList path="defendants_legal" title="法人/非法人组织" partyType="legal" />
      </FormSectionCard>
      <AgentList path="agents" />
      
      <GenericDefenseItemsSection 
        config={config.defenseItemsConfig}  
        formConfig={config} 
        getAnalysisContext={processFormDataForPreview}
        plaintiffClaims={plaintiffClaims}
        plaintiffFullText={plaintiffFullText}
      />
      
      {shouldShowFactsAndReasons && (
        <GenericFactsAndReasonsSection 
            config={config.factsAndReasonsConfig!}  
            formConfig={config} 
            getAnalysisContext={processFormDataForPreview}
            plaintiffFacts={plaintiffFacts}
            plaintiffFullText={plaintiffFullText}
        />
      )}
      
      {additionalSections}
      <FormSectionCard title="对纠纷解决方式的意愿">
        <MediationForm path="mediation" />
      </FormSectionCard>
    </FormPageLayout>
  );
};