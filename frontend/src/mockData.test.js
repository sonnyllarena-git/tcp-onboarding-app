import { describe, it, expect } from 'vitest';
import {
  MOCK_USERS,
  MOCK_REQUESTS,
  getMockUserById,
  getMockUserByEmail,
  getMockRequestById,
  getMockRequestByEmail,
  getMockUsersByStatus,
  getMockRequestsByStatus,
  getMockUsersByDepartment,
  getMockUsersByManager,
  getMockActiveUsers,
  getMockPendingUsers,
  getMockPendingRequests,
  getMockDataSummary,
} from './mockData';

describe('getMockUserById', () => {
  it('returns John Doe for id 7', () => {
    const user = getMockUserById(7);
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john.doe@thecreditpros.com');
  });

  it('coerces a string id', () => {
    expect(getMockUserById('7').name).toBe('John Doe');
  });

  it('returns null for an unknown id', () => {
    expect(getMockUserById(9999)).toBeNull();
  });
});

describe('getMockUserByEmail', () => {
  it('returns the correct user for a known email', () => {
    const user = getMockUserByEmail('john.doe@thecreditpros.com');
    expect(user.id).toBe(7);
    expect(user.name).toBe('John Doe');
  });

  it('is case-insensitive', () => {
    expect(getMockUserByEmail('JOHN.DOE@THECREDITPROS.COM').id).toBe(7);
  });

  it('returns null for an unknown email', () => {
    expect(getMockUserByEmail('nobody@thecreditpros.com')).toBeNull();
  });
});

describe('getMockRequestById', () => {
  it("returns Olivia Martin's request for id 101", () => {
    const request = getMockRequestById(101);
    expect(request.name).toBe('Olivia Martin');
    expect(request.employeeName).toBe('Olivia Martin');
  });

  it('returns null for an unknown id', () => {
    expect(getMockRequestById(9999)).toBeNull();
  });
});

describe('getMockRequestByEmail', () => {
  it('returns request 101 for olivia.martin@thecreditpros.com', () => {
    const request = getMockRequestByEmail('olivia.martin@thecreditpros.com');
    expect(request.id).toBe(101);
  });

  it('returns null for an unknown email', () => {
    expect(getMockRequestByEmail('nobody@thecreditpros.com')).toBeNull();
  });
});

describe('getMockUsersByStatus', () => {
  it('returns 10 active users', () => {
    expect(getMockUsersByStatus('active')).toHaveLength(10);
  });

  it('returns 6 pending users', () => {
    expect(getMockUsersByStatus('pending')).toHaveLength(6);
  });

  it('returns 4 inactive users', () => {
    expect(getMockUsersByStatus('inactive')).toHaveLength(4);
  });
});

describe('getMockRequestsByStatus', () => {
  it('returns 6 pending requests', () => {
    expect(getMockRequestsByStatus('pending')).toHaveLength(6);
  });

  it('returns 3 completed requests (2 onboarding + 1 offboarding)', () => {
    expect(getMockRequestsByStatus('completed')).toHaveLength(3);
  });
});

describe('getMockUsersByDepartment', () => {
  it('returns every IT user', () => {
    const itUsers = getMockUsersByDepartment('IT');
    expect(itUsers.map((user) => user.name).sort()).toEqual(
      ['John Doe', 'Lucas Ramirez', 'Olivia Martin', 'Sarah Miller'].sort()
    );
  });

  it('is case-insensitive', () => {
    expect(getMockUsersByDepartment('it')).toHaveLength(4);
  });
});

describe('getMockUsersByManager', () => {
  it('returns the user managed by a given manager', () => {
    const reports = getMockUsersByManager('Robert Chen');
    expect(reports).toHaveLength(1);
    expect(reports[0].name).toBe('John Doe');
  });

  it('never matches inactive users, who have a null manager', () => {
    // Mark Anderson historically managed Charlie Wilson (see the offboarding
    // request), but Charlie's current user record has manager: null.
    expect(getMockUsersByManager('Mark Anderson')).toHaveLength(0);
  });
});

describe('getMockActiveUsers', () => {
  it('returns 10 users', () => {
    expect(getMockActiveUsers()).toHaveLength(10);
  });
});

describe('getMockPendingUsers', () => {
  it('returns 6 users', () => {
    expect(getMockPendingUsers()).toHaveLength(6);
  });
});

describe('getMockPendingRequests', () => {
  it('returns 6 requests', () => {
    expect(getMockPendingRequests()).toHaveLength(6);
  });
});

describe('getMockDataSummary', () => {
  it('returns correct stats', () => {
    expect(getMockDataSummary()).toEqual({
      totalUsers: 20,
      activeUsers: 10,
      pendingUsers: 6,
      inactiveUsers: 4,
      totalRequests: 9,
      pendingRequests: 6,
      completedRequests: 3,
    });
  });
});

describe('data consistency and edge cases', () => {
  it('has exactly 20 users and 9 requests', () => {
    expect(MOCK_USERS).toHaveLength(20);
    expect(MOCK_REQUESTS).toHaveLength(9);
  });

  it('gives every inactive user a null manager', () => {
    const inactiveUsers = getMockUsersByStatus('inactive');
    expect(inactiveUsers.length).toBeGreaterThan(0);
    inactiveUsers.forEach((user) => {
      expect(user.manager).toBeNull();
    });
  });

  it('gives every active user an empty platforms list (nothing pending)', () => {
    getMockUsersByStatus('active').forEach((user) => {
      expect(user.platforms).toEqual([]);
    });
  });
});
