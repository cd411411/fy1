import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { monopolyDefenseConfig } from "../../configs/defense-configs";

export const MonopolyDisputeDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={monopolyDefenseConfig} />;
};

export default MonopolyDisputeDefenseFormPage;
