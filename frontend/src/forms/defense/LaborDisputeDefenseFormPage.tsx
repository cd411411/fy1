import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { laborDisputeDefenseConfig } from "../../configs/defense-configs";

export const LaborDisputeDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={laborDisputeDefenseConfig} />;
};

export default LaborDisputeDefenseFormPage;