export type VerificationStatus = 'pending' | 'verified' | 'correction-suggested' | 'flagged';

export type VerificationAction = 'verify' | 'correct' | 'context' | 'flag';

export interface VerificationEvent {
  id: string;
  action: VerificationAction;
  userId: string;
  note?: string;
  createdAt: string;
  user?: { id: string; name: string };
}

export interface CommunityNote {
  id: string;
  userId: string;
  body: string;
  createdAt: string;
  user?: { id: string; name: string };
}

export interface Correction {
  id: string;
  userId: string;
  field: string;
  suggestion: string;
  createdAt: string;
  accepted: boolean;
  user?: { id: string; name: string };
}

/**
 * Community-owned layer. Only human actions change verification status.
 */
export interface CommunityLayer {
  status: VerificationStatus;
  verifiedBy: number;
  notes: CommunityNote[];
  corrections: Correction[];
  history: VerificationEvent[];
}

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending: 'Pending Verification',
  verified: 'Community Verified',
  'correction-suggested': 'Correction Suggested',
  flagged: 'Flagged'
};

export const VERIFICATION_ACTION_LABELS: Record<VerificationAction, string> = {
  verify: 'Verify',
  correct: 'Suggest Correction',
  context: 'Add Context',
  flag: 'Flag'
};