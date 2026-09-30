'use client';

import React from 'react';
import { InsuranceTriggerPanel, InsuranceTriggerPanelProps } from './dashboard/InsuranceTriggerPanel';

export const InsurancePanel: React.FC<InsuranceTriggerPanelProps> = (props) => {
  return <InsuranceTriggerPanel {...props} />;
};

export default InsurancePanel;
