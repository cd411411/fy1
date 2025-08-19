import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { salesContractDefenseConfig } from "../../configs/defense-configs";

export const SalesContractDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={salesContractDefenseConfig} />;
};

export default SalesContractDefenseFormPage;
