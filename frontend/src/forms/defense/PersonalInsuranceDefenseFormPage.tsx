import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { personalInsuranceDefenseConfig } from "../../configs/defense-configs";

export const PersonalInsuranceDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={personalInsuranceDefenseConfig} />;
};

export default PersonalInsuranceDefenseFormPage;
