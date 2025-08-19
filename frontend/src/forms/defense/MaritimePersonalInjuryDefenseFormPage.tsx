import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { maritimePersonalInjuryDefenseConfig } from "../../configs/defense-configs";

export const MaritimePersonalInjuryDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={maritimePersonalInjuryDefenseConfig} />;
};

export default MaritimePersonalInjuryDefenseFormPage;
