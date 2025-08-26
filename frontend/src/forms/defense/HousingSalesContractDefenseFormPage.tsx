import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { housingSalesDefenseConfig } from "../../configs/defense-configs";

export const HousingSalesContractDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={housingSalesDefenseConfig} />;
};

export default HousingSalesContractDefenseFormPage;
