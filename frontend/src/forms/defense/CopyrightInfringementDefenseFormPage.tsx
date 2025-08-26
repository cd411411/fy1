import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { copyrightInfringementDefenseConfig } from "../../configs/defense-configs";

export const CopyrightInfringementDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={copyrightInfringementDefenseConfig} />;
};

export default CopyrightInfringementDefenseFormPage;
