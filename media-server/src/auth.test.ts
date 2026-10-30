import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bearerToken, canManageListing, type AdminProfile, type ListingAccess } from './auth.ts';

const listing: ListingAccess = { id: 'l1', admin_id: 'owner', region_path: ['state', 'city'] };

function admin(overrides: Partial<AdminProfile>): AdminProfile {
  return { id: 'someone', role: 'regional_admin', assigned_region_id: null, ...overrides };
}

test('super admins manage any listing', () => {
  assert.equal(canManageListing(admin({ role: 'super_admin' }), listing), true);
});

test('owners manage their own listing', () => {
  assert.equal(canManageListing(admin({ id: 'owner', role: 'agent' }), listing), true);
});

test('regional admins manage listings inside their region', () => {
  assert.equal(canManageListing(admin({ assigned_region_id: 'city' }), listing), true);
  assert.equal(canManageListing(admin({ assigned_region_id: 'elsewhere' }), listing), false);
});

test('regional admins without a region manage nothing they do not own', () => {
  assert.equal(canManageListing(admin({}), { ...listing, region_path: null }), false);
});

test('bearerToken reads the Authorization header', () => {
  assert.equal(bearerToken(new Headers({ authorization: 'Bearer abc' })), 'abc');
  assert.throws(() => bearerToken(new Headers()), /Missing bearer token/);
  assert.throws(() => bearerToken(new Headers({ authorization: 'Basic abc' })), /Missing bearer token/);
});
