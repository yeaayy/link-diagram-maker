
export class ShortcutDesc<T extends string> {
  constructor(
    readonly id: T,
    readonly name: string,
  ) {}
}

export const AllShortcut = [
  new ShortcutDesc('note-selection-tool', 'Activate note selection tool'),
  new ShortcutDesc('conn-selection-tool', 'Activate connection selection tool'),
  new ShortcutDesc('hand-tool', 'Activate hand tool'),
  new ShortcutDesc('delete', 'Delete'),
  new ShortcutDesc('force-delete', 'Force delete'),
  new ShortcutDesc('new-note', 'New note'),
  new ShortcutDesc('new-image-note', 'New note with image'),
  new ShortcutDesc('cancel', 'Close/cancel'),
  new ShortcutDesc('accept', 'Accept/ok'),
  new ShortcutDesc('select-all-note', 'Select all note'),
  new ShortcutDesc('select-all-connection', 'Select all connection'),
  new ShortcutDesc('select-like-connection', 'Select connection with the exact same style'),
  new ShortcutDesc('select-like-color', 'Select connection with the same color'),
  new ShortcutDesc('select-like-size', 'Select connection with the same size'),
  new ShortcutDesc('select-like-dash', 'Select connection with the same line dash style'),
  new ShortcutDesc('move-left', 'Move note left'),
  new ShortcutDesc('move-right', 'Move note right'),
  new ShortcutDesc('move-up', 'Move note up'),
  new ShortcutDesc('move-down', 'Move note down'),
  new ShortcutDesc('reset-view', 'Reset view'),
  new ShortcutDesc('save', 'Save'),
  new ShortcutDesc('undo', 'Undo'),
  new ShortcutDesc('redo', 'Redo'),
];

export type ShortcutID = (typeof AllShortcut)[number]['id'];

const shortcutMap = {} as {[ID in ShortcutID]: ShortcutDesc<ID>};
for (const desc of AllShortcut) {
  (shortcutMap[desc.id] as any) = desc;
}

export function getShortcutName(id: ShortcutID) {
  return shortcutMap[id].name;
}
