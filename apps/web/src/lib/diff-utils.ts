/**
 * Utilities for generating diff previews with addition/deletion highlights
 */

type DiffChange = {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
};

/**
 * Simple word-level diff algorithm
 * Returns array of changes with type (added/removed/unchanged)
 */
function computeWordDiff(oldText: string, newText: string): DiffChange[] {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  const changes: DiffChange[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldWords.length || newIndex < newWords.length) {
    if (oldIndex >= oldWords.length) {
      // Rest are additions
      changes.push({ type: 'added', value: newWords[newIndex] });
      newIndex++;
    } else if (newIndex >= newWords.length) {
      // Rest are deletions
      changes.push({ type: 'removed', value: oldWords[oldIndex] });
      oldIndex++;
    } else if (oldWords[oldIndex] === newWords[newIndex]) {
      // Same word
      changes.push({ type: 'unchanged', value: oldWords[oldIndex] });
      oldIndex++;
      newIndex++;
    } else {
      // Check if old word appears later in new
      const oldInNew = newWords.indexOf(oldWords[oldIndex], newIndex);
      const newInOld = oldWords.indexOf(newWords[newIndex], oldIndex);

      if (oldInNew !== -1 && (newInOld === -1 || oldInNew < newInOld)) {
        // Old word appears later, so current new words are additions
        changes.push({ type: 'added', value: newWords[newIndex] });
        newIndex++;
      } else if (newInOld !== -1) {
        // New word appears later, so current old words are deletions
        changes.push({ type: 'removed', value: oldWords[oldIndex] });
        oldIndex++;
      } else {
        // Both are different - mark as deletion + addition
        changes.push({ type: 'removed', value: oldWords[oldIndex] });
        changes.push({ type: 'added', value: newWords[newIndex] });
        oldIndex++;
        newIndex++;
      }
    }
  }

  return changes;
}

/**
 * Strip HTML tags from a string to get plain text
 */
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Generate diff preview HTML with green (additions) and red (deletions) highlights
 */
export function generateDiffPreview(originalHtml: string, newHtml: string): string {
  const oldText = stripHtml(originalHtml);
  const newText = stripHtml(newHtml);

  const changes = computeWordDiff(oldText, newText);

  const parts: string[] = [];
  for (const change of changes) {
    if (change.type === 'added') {
      parts.push(`<span data-diff="addition" style="background-color: #d4edda; color: #155724; padding: 2px 0; border-radius: 2px;">${escapeHtml(change.value)}</span>`);
    } else if (change.type === 'removed') {
      parts.push(`<span data-diff="deletion" style="background-color: #f8d7da; color: #721c24; text-decoration: line-through; padding: 2px 0; border-radius: 2px;">${escapeHtml(change.value)}</span>`);
    } else {
      parts.push(escapeHtml(change.value));
    }
  }

  return `<p>${parts.join('')}</p>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Apply diff marks to editor content for preview
 * This version uses paragraph-level highlighting for better readability
 */
export function applyDiffMarks(
  originalHtml: string,
  newHtml: string
): { diffHtml: string; hasChanges: boolean } {
  const oldText = stripHtml(originalHtml);
  const newText = stripHtml(newHtml);

  if (oldText === newText) {
    return { diffHtml: newHtml, hasChanges: false };
  }

  // Split into paragraphs
  const oldParagraphs = originalHtml.split(/<\/p>/i).filter(p => p.trim());
  const newParagraphs = newHtml.split(/<\/p>/i).filter(p => p.trim());

  const parts: string[] = [];
  let hasAdditions = false;
  let hasDeletions = false;

  const maxLength = Math.max(oldParagraphs.length, newParagraphs.length);

  for (let i = 0; i < maxLength; i++) {
    const oldP = oldParagraphs[i] || '';
    const newP = newParagraphs[i] || '';

    // Clean up paragraph tags
    const oldPClean = oldP.replace(/<p[^>]*>/i, '').trim();
    const newPClean = newP.replace(/<p[^>]*>/i, '').trim();

    if (oldPClean === newPClean) {
      // Unchanged paragraph
      if (newPClean) {
        parts.push(`<p>${newPClean}</p>`);
      }
    } else if (!oldPClean && newPClean) {
      // New paragraph added
      parts.push(`<p data-diff="addition" style="background-color: #d4edda; padding: 8px; border-radius: 4px;">${newPClean}</p>`);
      hasAdditions = true;
    } else if (oldPClean && !newPClean) {
      // Paragraph deleted
      parts.push(`<p data-diff="deletion" style="background-color: #f8d7da; text-decoration: line-through; padding: 8px; border-radius: 4px;">${oldPClean}</p>`);
      hasDeletions = true;
    } else {
      // Paragraph modified - show both
      parts.push(`<p data-diff="deletion" style="background-color: #f8d7da; text-decoration: line-through; padding: 8px; border-radius: 4px;">${oldPClean}</p>`);
      parts.push(`<p data-diff="addition" style="background-color: #d4edda; padding: 8px; border-radius: 4px;">${newPClean}</p>`);
      hasAdditions = true;
      hasDeletions = true;
    }
  }

  return {
    diffHtml: parts.join(''),
    hasChanges: hasAdditions || hasDeletions
  };
}
