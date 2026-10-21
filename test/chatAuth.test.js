const assert = require('node:assert');
const test = require('node:test');
const mongoose = require('mongoose');
const Attendee = require('../src/models/Attendee');
const { assertAttendeeCheckedIn } = require('../src/utils/chatAuth');

test('assertAttendeeCheckedIn unit tests', async (t) => {
  const validAttendeeId = new mongoose.Types.ObjectId().toString();
  const validEventId = new mongoose.Types.ObjectId().toString();

  await t.test('rejects invalid attendeeId', async () => {
    const res = await assertAttendeeCheckedIn('invalid-id', validEventId);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.reason, 'Invalid attendee identity');
  });

  await t.test('rejects invalid eventId', async () => {
    const res = await assertAttendeeCheckedIn(validAttendeeId, 'invalid-id');
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.reason, 'Valid event ID is required');
  });

  await t.test('rejects when attendee not found or cancelled', async () => {
    const originalFindOne = Attendee.findOne;
    Attendee.findOne = () => ({
      select: () => Promise.resolve(null),
    });

    try {
      const res = await assertAttendeeCheckedIn(validAttendeeId, validEventId);
      assert.strictEqual(res.allowed, false);
      assert.strictEqual(res.reason, 'You are not registered for this event');
    } finally {
      Attendee.findOne = originalFindOne;
    }
  });

  await t.test('rejects when attendee is registered but not checked in', async () => {
    const originalFindOne = Attendee.findOne;
    Attendee.findOne = () => ({
      select: () => Promise.resolve({
        _id: validAttendeeId,
        eventId: validEventId,
        isCheckedIn: false,
        status: 'verified',
        name: 'Jane Doe',
      }),
    });

    try {
      const res = await assertAttendeeCheckedIn(validAttendeeId, validEventId);
      assert.strictEqual(res.allowed, false);
      assert.strictEqual(res.reason, 'You must be checked in to participate in the event chat');
      assert.ok(res.attendee);
      assert.strictEqual(res.attendee.isCheckedIn, false);
    } finally {
      Attendee.findOne = originalFindOne;
    }
  });

  await t.test('allows when attendee is registered and checked in', async () => {
    const originalFindOne = Attendee.findOne;
    Attendee.findOne = () => ({
      select: () => Promise.resolve({
        _id: validAttendeeId,
        eventId: validEventId,
        isCheckedIn: true,
        status: 'verified',
        name: 'Jane Doe',
      }),
    });

    try {
      const res = await assertAttendeeCheckedIn(validAttendeeId, validEventId);
      assert.strictEqual(res.allowed, true);
      assert.strictEqual(res.reason, null);
      assert.ok(res.attendee);
      assert.strictEqual(res.attendee.isCheckedIn, true);
    } finally {
      Attendee.findOne = originalFindOne;
    }
  });
});
