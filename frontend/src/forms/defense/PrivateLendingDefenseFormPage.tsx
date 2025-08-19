import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { privateLendingDefenseConfig } from "../../configs/defense-configs";

export const PrivateLendingDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={privateLendingDefenseConfig} />;
};

export default PrivateLendingDefenseFormPage;
