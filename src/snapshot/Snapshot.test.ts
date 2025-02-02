import { expect, test } from "vitest";
import { SnapshotType, mergeSnapshotAction, type SnapshotActionCreate, type SnapshotActionDelete, type SnapshotActionEdit } from "./Snapshot";

type TestID = { id: number };
type TestData = { v1: number, v2: number };

function create(v1: number = 2, v2: number = 3): SnapshotActionCreate<TestID, TestData> {
  return {
    type: SnapshotType.create,
    id: 1,
    v1,
    v2,
  };
}

function _delete(): SnapshotActionDelete<TestID> {
  return {
    type: SnapshotType.delete,
    id: 1,
  };
}

function edit(v1?: number, v2?: number): SnapshotActionEdit<TestID, TestData> {
  return {
    type: SnapshotType.edit,
    id: 1,
    v1,
    v2,
  };
}

test('create * edit', () => {
  const a = create();
  const b = edit(6);
  const a_copy = {...a};
  const b_copy = {...b};
  const result = mergeSnapshotAction(a, b);
  expect(a).toStrictEqual(a_copy);
  expect(b).toStrictEqual(b_copy);
  expect(result).toStrictEqual(create(6));
});

test('create * delete', () => {
  const a = create();
  const b = _delete();
  const a_copy = {...a};
  const b_copy = {...b};
  const result = mergeSnapshotAction(a, b);
  expect(a).toStrictEqual(a_copy);
  expect(b).toStrictEqual(b_copy);
  expect(result).toStrictEqual(undefined);
});

test('edit * edit', () => {
  const a = edit(6);
  const b = edit(undefined, 7);
  const a_copy = {...a};
  const b_copy = {...b};
  const result = mergeSnapshotAction(a, b);
  expect(a).toStrictEqual(a_copy);
  expect(b).toStrictEqual(b_copy);
  expect(result).toStrictEqual(edit(6, 7));
});

test('edit * delete', () => {
  const a = edit(6);
  const b = _delete();
  const a_copy = {...a};
  const b_copy = {...b};
  const result = mergeSnapshotAction(a, b);
  expect(a).toStrictEqual(a_copy);
  expect(b).toStrictEqual(b_copy);
  expect(result).toStrictEqual(_delete());
});

test('delete * create', () => {
  const a = _delete();
  const b = create();
  const a_copy = {...a};
  const b_copy = {...b};
  const result = mergeSnapshotAction(a, b);
  expect(a).toStrictEqual(a_copy);
  expect(b).toStrictEqual(b_copy);
  expect(result).toStrictEqual(edit(2, 3));
});
