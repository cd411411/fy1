import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { divorceDisputeDefenseConfig } from "../../configs/defense-configs";

export const DivorceDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={divorceDisputeDefenseConfig} />;
};

export default DivorceDefenseFormPage;