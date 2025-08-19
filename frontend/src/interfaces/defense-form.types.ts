


export interface DefenseFormConfig {
  caseType: string;
  title: string;
  formId: string;
  defenseItemsConfig: DefenseItemConfig[];
  factsAndReasonsConfig?: DefenseItemConfig[];
  partyBlueprint?: PartyBlueprint[];
  showFactsAndReasons?: boolean;
}

export type ObjectionOptionType = 'yes_no' | 'confirm_object';

export interface DefenseItemConfig {
  id: string;
  title: string;
  type: 'objection' | 'textarea' | 'optimizable_textarea' | 'legal_analyze_textarea';
  placeholder?: string;
  optimizationContext?: string;
  optionType?: ObjectionOptionType;
  withContractAnalysis?: boolean;
  label?: string;
}

export interface PartyBlueprint {
  path: string;
  roleText: string;
  type: 'natural' | 'legal';
}

export interface GenericDefenseItemsSectionProps {
  config: DefenseItemConfig[];
  sectionTitle?: string;
  fullStatementPath?: string;
  fullStatementPlaceholder?: string;
  tableDescription?: string;
}

export interface GenericFactsAndReasonsSectionProps {
  config: DefenseItemConfig[];
  sectionTitle?: string;
  fullStatementPath?: string;
  fullStatementPlaceholder?: string;
  tableDescription?: string;
  getAnalysisContext?: (data: any) => any;

}

export interface GenericDefenseFormPageProps {
  config: DefenseFormConfig;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  additionalSections?: React.ReactNode;
}

