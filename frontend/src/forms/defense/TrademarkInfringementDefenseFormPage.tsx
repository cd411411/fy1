import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { trademarkInfringementDefenseConfig } from "../../configs/defense-configs";

export const TrademarkInfringementDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={trademarkInfringementDefenseConfig} />;
};

export default TrademarkInfringementDefenseFormPage;
