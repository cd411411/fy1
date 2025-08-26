import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { maritimeFreightForwardingDefenseConfig } from "../../configs/defense-configs";

export const MaritimeFreightForwardingDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={maritimeFreightForwardingDefenseConfig} />;
};

export default MaritimeFreightForwardingDefenseFormPage;
