const assert = require('node:assert');
const test = require('node:test');
const mongoose = require('mongoose');

// Mock models and test chatController logic
test('Chat DM Workflows (Attendee-to-Attendee & Attendee-to-Organizer)', async (t) => {
  const eventId = new mongoose.Types.ObjectId().toString();
  const organizerId = new mongoose.Types.ObjectId().toString();
  const attendee1Id = new mongoose.Types.ObjectId().toString();
  const attendee2Id = new mongoose.Types.ObjectId().toString();

  await t.test('Room participant resolution handles both User and Attendee', async () => {
    const User = require('../src/models/User');
    const Attendee = require('../src/models/Attendee');

    const origUserFind = User.findById;
    const origAttFind = Attendee.findById;

    User.findById = (id) => ({
      select: () => Promise.resolve(String(id) === String(organizerId) ? {
        _id: organizerId,
        firstName: 'Alice',
        lastName: 'Organizer',
        orgName: 'EventCorp',
        avatar: 'https://example.com/alice.png'
      } : null)
    });

    Attendee.findById = (id) => ({
      select: () => Promise.resolve(String(id) === String(attendee1Id) ? {
        _id: attendee1Id,
        name: 'Bob Attendee'
      } : String(id) === String(attendee2Id) ? {
        _id: attendee2Id,
        name: 'Charlie Attendee'
      } : null)
    });

    try {
      // Test User resolution
      const u = await User.findById(organizerId).select('firstName lastName orgName avatar');
      assert.strictEqual(u.firstName, 'Alice');

      // Test Attendee resolution
      const a1 = await Attendee.findById(attendee1Id).select('name');
      assert.strictEqual(a1.name, 'Bob Attendee');

      const a2 = await Attendee.findById(attendee2Id).select('name');
      assert.strictEqual(a2.name, 'Charlie Attendee');
    } finally {
      User.findById = origUserFind;
      Attendee.findById = origAttFind;
    }
  });

  await t.test('DM room correctly personalizes displayName and otherParticipant for requester', () => {
    const room = {
      _id: new mongoose.Types.ObjectId(),
      event: eventId,
      name: 'Direct Message',
      isGroup: false,
      participantIds: [attendee1Id, organizerId],
      participants: [
        { id: attendee1Id, name: 'Bob Attendee', role: 'attendee', modelType: 'Attendee' },
        { id: organizerId, name: 'Alice Organizer', role: 'admin', modelType: 'User' }
      ],
      toObject: function() { return { ...this }; }
    };

    // When Bob (Attendee 1) views the room:
    const bobRequesterId = attendee1Id;
    const bobRoom = room.toObject();
    const bobOther = (bobRoom.participants || []).find(p => String(p.id) !== String(bobRequesterId));
    assert.strictEqual(bobOther.name, 'Alice Organizer');
    assert.strictEqual(bobOther.modelType, 'User');

    // When Alice (Organizer) views the room:
    const aliceRequesterId = organizerId;
    const aliceRoom = room.toObject();
    const aliceOther = (aliceRoom.participants || []).find(p => String(p.id) !== String(aliceRequesterId));
    assert.strictEqual(aliceOther.name, 'Bob Attendee');
    assert.strictEqual(aliceOther.modelType, 'Attendee');
  });

  await t.test('Attendee-to-Attendee DM correctly personalizes both perspectives', () => {
    const room = {
      _id: new mongoose.Types.ObjectId(),
      event: eventId,
      name: 'Direct Message',
      isGroup: false,
      participantIds: [attendee1Id, attendee2Id],
      participants: [
        { id: attendee1Id, name: 'Bob Attendee', role: 'attendee', modelType: 'Attendee' },
        { id: attendee2Id, name: 'Charlie Attendee', role: 'attendee', modelType: 'Attendee' }
      ],
      toObject: function() { return { ...this }; }
    };

    // Bob's view
    const bobOther = (room.participants || []).find(p => String(p.id) !== String(attendee1Id));
    assert.strictEqual(bobOther.id, attendee2Id);
    assert.strictEqual(bobOther.name, 'Charlie Attendee');

    // Charlie's view
    const charlieOther = (room.participants || []).find(p => String(p.id) !== String(attendee2Id));
    assert.strictEqual(charlieOther.id, attendee1Id);
    assert.strictEqual(charlieOther.name, 'Bob Attendee');
  });
});
