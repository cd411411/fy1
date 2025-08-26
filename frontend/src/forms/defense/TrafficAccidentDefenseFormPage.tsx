import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { trafficAccidentDefenseConfig } from "../../configs/defense-configs";

export const TrafficAccidentDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={trafficAccidentDefenseConfig} />;
};

export default TrafficAccidentDefenseFormPage;
