import { routeConversationPair } from './support-routing';

const SUPPORT = 'support-admin';
const staff = new Set([SUPPORT, 'other-admin']);
const isStaff = (id: string) => staff.has(id);

describe('routeConversationPair', () => {
  it('sends a student who messages any admin to the support admin', () => {
    const routed = routeConversationPair({ myId: 'ada', otherId: 'other-admin', supportAdminId: SUPPORT, isStaff });
    expect(routed).toEqual({ firstId: 'ada', secondId: SUPPORT, readerId: 'ada', otherId: SUPPORT });
  });

  it('lets any admin answer a student inside the support thread', () => {
    const routed = routeConversationPair({ myId: 'other-admin', otherId: 'ada', supportAdminId: SUPPORT, isStaff });
    expect(routed).toEqual({ firstId: SUPPORT, secondId: 'ada', readerId: SUPPORT, otherId: 'ada' });
  });

  it('keeps the support admin in their own seat', () => {
    const routed = routeConversationPair({ myId: SUPPORT, otherId: 'ada', supportAdminId: SUPPORT, isStaff });
    expect(routed.readerId).toBe(SUPPORT);
    expect(routed.otherId).toBe('ada');
  });

  it('leaves student-to-student and staff-to-staff chats alone', () => {
    const students = routeConversationPair({ myId: 'ada', otherId: 'zainab', supportAdminId: SUPPORT, isStaff });
    expect(students).toEqual({ firstId: 'ada', secondId: 'zainab', readerId: 'ada', otherId: 'zainab' });
    const admins = routeConversationPair({ myId: 'other-admin', otherId: SUPPORT, supportAdminId: SUPPORT, isStaff });
    expect(admins.otherId).toBe(SUPPORT);
  });

  it('does nothing when no support admin exists yet', () => {
    const routed = routeConversationPair({ myId: 'ada', otherId: 'other-admin', supportAdminId: null, isStaff });
    expect(routed.otherId).toBe('other-admin');
  });
});
