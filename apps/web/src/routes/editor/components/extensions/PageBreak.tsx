import { Node, mergeAttributes } from '@tiptap/core';

export const PageBreakNode = Node.create({
  name: 'pageBreak',

  group: 'block',

  parseHTML() {
    return [
      {
        tag: 'div.page-break-separator'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'page-break-separator' })];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name });
        }
    };
  }
});
