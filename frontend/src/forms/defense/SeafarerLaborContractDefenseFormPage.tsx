import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { seafarerLaborDefenseConfig } from "../../configs/defense-configs";

export const SeafarerLaborContractDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={seafarerLaborDefenseConfig} />;
};

export default SeafarerLaborContractDefenseFormPage;
