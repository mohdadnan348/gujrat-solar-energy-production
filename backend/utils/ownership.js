const mongoose = require('mongoose');

/**
 * Returns the HR ownership scope. Admin sees all records.
 * HR sees records owned by them; legacy records can be included only
 * when their creator is the HR (migration should backfill ownerHR).
 */
const hrOwnerFilter = (user, field = 'ownerHR') => {
  if (user.role === 'Admin') return {};
  if (user.role === 'HR') return { [field]: user._id };
  return { _id: null };
};

const isSameId = (a, b) => Boolean(a && b && String(a) === String(b));

const assertHRRecordAccess = (record, user, ownerField = 'ownerHR') => {
  if (!record) return false;
  if (user.role === 'Admin') return true;
  if (user.role !== 'HR') return false;
  return isSameId(record[ownerField], user._id) ||
    isSameId(record.createdBy, user._id);
};

module.exports = { hrOwnerFilter, assertHRRecordAccess, isSameId };
