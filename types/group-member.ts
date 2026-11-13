export type ManageGroupMember = {
  id: string;
  name: string;
  status: 'you' | 'pending' | 'accepted' | 'paid';
  via: 'direct' | 'code';
  avatar_url?: string | null;
};
