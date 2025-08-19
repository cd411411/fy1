import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { guaranteeInsuranceDefenseConfig } from "../../configs/defense-configs";

export const GuaranteeInsuranceDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={guaranteeInsuranceDefenseConfig} />;
};

export default GuaranteeInsuranceDefenseFormPage;
