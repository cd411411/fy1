import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { designPatentDefenseConfig } from "../../configs/defense-configs";

export const DesignPatentInfringementDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={designPatentDefenseConfig} />;
};

export default DesignPatentInfringementDefenseFormPage;
