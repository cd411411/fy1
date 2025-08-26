import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { financialLoanDefenseConfig } from "../../configs/defense-configs";

export const FinancialLoanDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={financialLoanDefenseConfig} />;
};

export default FinancialLoanDefenseFormPage;
