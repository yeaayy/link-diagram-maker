import { BoardView } from '@/model/BoardView';
import { ConnPosition } from '@/model/ConnectionView';
import { expect, test } from 'vitest';
import ConnectionSnapshot from './ConnectionSnapshot';
import { Snapshot, SnapshotType, type ConnectionSnapshotActionEdit } from './Snapshot';

function newSnapshot(board: BoardView) {
  const snapshot = new Snapshot(board.id);
  board.noteSnapshotAction.listen((backward, forward) => snapshot.pushNoteSnapshotAction(forward));
  board.connectionSnapshotAction.listen((backward, forward) => snapshot.pushConnectionSnapshotAction(forward));
  return snapshot;
}

test('Connection create have correct side effect', () => {
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');
  const conn = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.left);

  expect(noteA.conn.has(noteB.id)).true
  expect(noteB.conn.has(noteA.id)).true
  expect(board.connections.indexOf(conn)).not.eq(-1)
});

test('Connection destroy have correct side effect', () => {
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');
  const conn = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.left);
  conn.destroy();

  expect(noteA.conn.has(noteB.id)).false
  expect(noteB.conn.has(noteA.id)).false
  expect(board.connections.indexOf(conn)).eq(-1)
});

test('Connection create ordered', () => {
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');

  {
    const conn = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.left);
    expect(conn.a).toBe(noteA);
    expect(conn.pa).toBe(ConnPosition.top);
    expect(conn.b).toBe(noteB);
    expect(conn.pb).toBe(ConnPosition.left);
    conn.destroy();
  }

  {
    const conn = board.newConnection(noteB, ConnPosition.left, noteA, ConnPosition.top);
    expect(conn.a).toBe(noteA);
    expect(conn.pa).toBe(ConnPosition.top);
    expect(conn.b).toBe(noteB);
    expect(conn.pb).toBe(ConnPosition.left);
    conn.destroy()
  }
})

test('Connection empty > create', () => {
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');
  const s = newSnapshot(board);

  // Test
  const conn = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.top);

  // Check
  const key = s.getConnectionKey(ConnectionSnapshot.getId(conn));
  const sn = s.connections.get(key)
  expect(sn).exist;
  expect(sn!.type).eq(SnapshotType.create);
})

test('Connection empty > edit', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');
  const s = newSnapshot(board);
  
  const conn = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.top);
  conn.attach(svg);
  s.reset();

  // Test
  conn.color = 'ffffff';

  // Check
  const key = s.getConnectionKey(ConnectionSnapshot.getId(conn));
  const sn = s.connections.get(key) as ConnectionSnapshotActionEdit;
  expect(sn).exist;
  expect(sn.type).eq(SnapshotType.edit);
  expect(sn.color).exist;
})

test('Connection empty > delete', () => {
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');
  const s = newSnapshot(board);
  const conn = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.top);
  s.reset();

  // Test
  conn.destroy()

  // Check
  const key = s.getConnectionKey(ConnectionSnapshot.getId(conn));
  const sn = s.connections.get(key)
  expect(sn).exist;
  expect(sn!.type).exist.eq(SnapshotType.delete);
})

test('Connection create > create', () => {
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');
  const s = newSnapshot(board);
  const conn = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.top);
  s.reset();

  // Test
  expect(() => board.newConnection(noteA, ConnPosition.left, noteB, ConnPosition.left))
    .toThrow()
})

test('Connection create > edit', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');
  const s = newSnapshot(board);
  s.reset();

  // Test
  const conn = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.top);
  conn.attach(svg);
  conn.color = 'ffffff';

  // Check
  const key = s.getConnectionKey(ConnectionSnapshot.getId(conn));
  const sn = s.connections.get(key) as ConnectionSnapshotActionEdit;
  expect(sn).exist;
  expect(sn.type).exist.eq(SnapshotType.create);
  expect(sn.color).toBe('ffffff');
  expect(sn.size).exist
})

test('Connection create > delete', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');
  const s = newSnapshot(board);
  s.reset();

  // Test
  const conn = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.top);
  conn.attach(svg);
  conn.destroy();

  // Check
  const key = s.getConnectionKey(ConnectionSnapshot.getId(conn));
  expect(s.connections.get(key)).undefined;
})

test('Connection edit > create', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');
  const s = newSnapshot(board);
  const conn = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.top);
  conn.attach(svg);
  s.reset();

  // Test
  conn.color = 'ffffff';
  expect(() => board.newConnection(noteA, ConnPosition.left, noteB, ConnPosition.left))
    .toThrow()
})

test('Connection edit > edit', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');
  const s = newSnapshot(board);
  const conn = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.top, '000000', 5);
  conn.attach(svg);
  s.reset();

  // Test
  conn.color = 'ffffff';
  conn.size = 10;

  // Check
  const key = s.getConnectionKey(ConnectionSnapshot.getId(conn));
  const sn = s.connections.get(key) as ConnectionSnapshotActionEdit;
  expect(sn).exist;
  expect(sn.type).eq(SnapshotType.edit);
  expect(sn.color).toBe('ffffff');
  expect(sn.size).toBe(10);
})

test('Connection edit > delete', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');
  const s = newSnapshot(board);
  const conn = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.top, '000000', 5);
  conn.attach(svg);
  s.reset();

  // Test
  conn.color = 'ffffff';
  conn.destroy();

  // Check
  const key = s.getConnectionKey(ConnectionSnapshot.getId(conn));
  const sn = s.connections.get(key)
  expect(sn).exist;
  expect(sn!.type).eq(SnapshotType.delete);
});

test('Connection delete > create', () => {
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');
  const s = newSnapshot(board);
  const conn1 = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.top, '000000', 5);
  s.reset();

  // Test
  conn1.destroy();
  const conn2 = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.top, 'ffffff', 10);

  // Check
  const key = s.getConnectionKey(ConnectionSnapshot.getId(conn2));
  const sn = s.connections.get(key) as ConnectionSnapshotActionEdit;
  expect(sn).exist;
  expect(sn.type).eq(SnapshotType.edit);
  expect(sn.color).toBe('ffffff');
  expect(sn.size).toBe(10);
});

test('Connection delete > delete', () => {
  const board = new BoardView('');
  const noteA = board.newNote(0, 0, 0, '');
  const noteB = board.newNote(1, 0, 0, '');
  const s = newSnapshot(board);
  const conn = board.newConnection(noteA, ConnPosition.top, noteB, ConnPosition.top, '000000', 5);
  s.reset();

  // Test
  conn.destroy();
  conn.destroy();

  // Check
  const key = s.getConnectionKey(ConnectionSnapshot.getId(conn));
  const sn = s.connections.get(key)
  expect(sn).exist;
  expect(sn!.type).eq(SnapshotType.delete);
});
