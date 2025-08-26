import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { technologyContractDefenseConfig } from "../../configs/defense-configs";

export const TechnologyContractDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={technologyContractDefenseConfig} />;
};

export default TechnologyContractDefenseFormPage;
