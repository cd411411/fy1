import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { creditCardDefenseConfig } from "../../configs/defense-configs";

export const CreditCardDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={creditCardDefenseConfig} />;
};

export default CreditCardDefenseFormPage;
