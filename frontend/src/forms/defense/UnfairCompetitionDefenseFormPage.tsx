import React from "react";
import { GenericDefenseFormPage } from "../../components/defense/GenericDefenseFormPage";
import { unfairCompetitionDefenseConfig } from "../../configs/defense-configs";

export const UnfairCompetitionDefenseFormPage: React.FC = () => {
  return <GenericDefenseFormPage config={unfairCompetitionDefenseConfig} />;
};

export default UnfairCompetitionDefenseFormPage;