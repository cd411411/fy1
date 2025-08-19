import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { environmentalPollutionDefenseConfig } from "../../configs/defense-configs";

export const EnvironmentalPollutionPublicInterestDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={environmentalPollutionDefenseConfig} />;
};

export default EnvironmentalPollutionPublicInterestDefenseFormPage;
