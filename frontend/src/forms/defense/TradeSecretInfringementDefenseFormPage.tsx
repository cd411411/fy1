import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { tradeSecretInfringementDefenseConfig } from "../../configs/defense-configs";

export const TradeSecretInfringementDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={tradeSecretInfringementDefenseConfig} />;
};

export default TradeSecretInfringementDefenseFormPage;
