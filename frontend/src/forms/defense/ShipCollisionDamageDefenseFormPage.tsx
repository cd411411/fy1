import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { shipCollisionDefenseConfig } from "../../configs/defense-configs";

export const ShipCollisionDamageDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={shipCollisionDefenseConfig} />;
};

export default ShipCollisionDamageDefenseFormPage;
