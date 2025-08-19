import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { liabilityInsuranceDefenseConfig } from "../../configs/defense-configs";

export const LiabilityInsuranceDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={liabilityInsuranceDefenseConfig} />;
};

export default LiabilityInsuranceDefenseFormPage;
