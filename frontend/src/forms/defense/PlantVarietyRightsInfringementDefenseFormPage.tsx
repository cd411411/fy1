import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { plantVarietyDefenseConfig } from "../../configs/defense-configs";

export const PlantVarietyRightsInfringementDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={plantVarietyDefenseConfig} />;
};

export default PlantVarietyRightsInfringementDefenseFormPage;
