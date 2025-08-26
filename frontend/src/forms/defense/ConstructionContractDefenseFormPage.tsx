import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { constructionContractDisputeDefenseConfig } from "../../configs/defense-configs";

export const ConstructionContractDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={constructionContractDisputeDefenseConfig} />;
};

export default ConstructionContractDefenseFormPage;