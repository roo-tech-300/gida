export type ManageGroupMember = {
  id: string;
  name: string;
  status: 'you' | 'pending' | 'accepted' | 'paid';
  via: 'direct' | 'code';
};

export const MOCK_GROUP_MEMBERS: ManageGroupMember[] = [
  { id: 'gm-tunde', name: 'Tunde Adeyemi', status: 'paid', via: 'direct' },
  { id: 'gm-amara', name: 'Amara Nwosu', status: 'accepted', via: 'direct' },
  { id: 'gm-kelechi', name: 'Kelechi Obi', status: 'accepted', via: 'code' },
  { id: 'gm-segun', name: 'Segun Ojo', status: 'pending', via: 'code' },
];
