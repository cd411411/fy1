import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { propertyServiceDefenseConfig } from "../../configs/defense-configs";

export const PropertyManagementContractDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={propertyServiceDefenseConfig} />;
};

export default PropertyManagementContractDefenseFormPage;
