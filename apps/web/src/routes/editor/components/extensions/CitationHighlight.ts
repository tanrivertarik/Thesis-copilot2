import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, type EditorState, type Transaction } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

const CITATION_REGEX = /\[CITE:[^\]\s]+\]/g;

export const CitationHighlightExtension = Extension.create({
  name: 'citationHighlight',

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('citationHighlight');

    const createDecorations = (doc: ProseMirrorNode) => {
      const decorations: Decoration[] = [];

      doc.descendants((node: ProseMirrorNode, pos: number) => {
        if (!node.isText) {
          return true;
        }

        const text = node.text ?? '';
        let match: RegExpExecArray | null;
        while ((match = CITATION_REGEX.exec(text)) !== null) {
          const from = pos + match.index;
          const to = from + match[0].length;
          decorations.push(
            Decoration.inline(from, to, {
              class: 'citation-token'
            })
          );
        }

        return true;
      });

      return DecorationSet.create(doc, decorations);
    };

    const plugin: Plugin<DecorationSet> = new Plugin<DecorationSet>({
      key: pluginKey,
      state: {
        init: (_config: unknown, state: EditorState) => createDecorations(state.doc),
        apply: (tr: Transaction, old: DecorationSet) => {
          if (tr.docChanged) {
            return createDecorations(tr.doc);
          }
          return old;
        }
      },
      props: {
        decorations(state: EditorState): DecorationSet {
          return (plugin.getState(state) as DecorationSet) ?? DecorationSet.empty;
        }
      }
    });

    return [plugin];
  }
});
