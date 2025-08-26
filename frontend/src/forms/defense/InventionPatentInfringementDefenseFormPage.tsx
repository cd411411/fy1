import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { inventionPatentDefenseConfig } from "../../configs/defense-configs";

export const InventionPatentInfringementDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={inventionPatentDefenseConfig} />;
};

export default InventionPatentInfringementDefenseFormPage;
