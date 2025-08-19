import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { securitiesMisrepresentationDefenseConfig } from "../../configs/defense-configs";

export const SecuritiesMisrepresentationDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={securitiesMisrepresentationDefenseConfig} />;
};

export default SecuritiesMisrepresentationDefenseFormPage;
