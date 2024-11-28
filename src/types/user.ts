export interface ReferralProgram {
  invitedBy: number | null;
  invitedUserIds: number[];
}

export interface UserStats {
  basicReqsMade: number;
  proReqsMade: number;
  imgGensMade: number;
}