import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { propertyInsuranceDefenseConfig } from "../../configs/defense-configs";

export const PropertyDamageInsuranceDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={propertyInsuranceDefenseConfig} />;
};

export default PropertyDamageInsuranceDefenseFormPage;
