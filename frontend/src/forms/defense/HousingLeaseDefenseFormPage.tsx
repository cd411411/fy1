import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { housingLeaseDefenseConfig } from "../../configs/defense-configs";

export const HousingLeaseDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={housingLeaseDefenseConfig} />;
};

export default HousingLeaseDefenseFormPage;
