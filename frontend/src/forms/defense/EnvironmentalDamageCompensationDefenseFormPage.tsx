import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { environmentalDamageDefenseConfig } from "../../configs/defense-configs";

export const EnvironmentalDamageCompensationDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={environmentalDamageDefenseConfig} />;
};

export default EnvironmentalDamageCompensationDefenseFormPage;
