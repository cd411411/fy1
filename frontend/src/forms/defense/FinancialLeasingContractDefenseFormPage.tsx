import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { financialLeasingDefenseConfig } from "../../configs/defense-configs";

export const FinancialLeasingContractDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={financialLeasingDefenseConfig} />;
};

export default FinancialLeasingContractDefenseFormPage;
