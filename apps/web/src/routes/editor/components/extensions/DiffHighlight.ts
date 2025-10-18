import { Mark, mergeAttributes } from '@tiptap/core';

export const DiffAdditionMark = Mark.create({
  name: 'diffAddition',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-diff="addition"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-diff': 'addition',
        style: 'background-color: #d4edda; color: #155724; padding: 2px 0; border-radius: 2px;',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setDiffAddition:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      unsetDiffAddition:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

export const DiffDeletionMark = Mark.create({
  name: 'diffDeletion',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-diff="deletion"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-diff': 'deletion',
        style: 'background-color: #f8d7da; color: #721c24; text-decoration: line-through; padding: 2px 0; border-radius: 2px;',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setDiffDeletion:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      unsetDiffDeletion:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
