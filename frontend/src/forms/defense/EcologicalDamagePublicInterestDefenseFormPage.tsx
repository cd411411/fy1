import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { ecologicalDamageDefenseConfig } from "../../configs/defense-configs";

export const EcologicalDamagePublicInterestDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={ecologicalDamageDefenseConfig} />;
};

export default EcologicalDamagePublicInterestDefenseFormPage;
