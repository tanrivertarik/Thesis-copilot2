/**
 * Enhanced Drafting Service Unit Test
 * 
 * Tests the structure and basic functionality of our enhanced services
 * without requiring external dependencies.
 */

import { describe, it, expect } from 'vitest';

describe('Enhanced Drafting Service Structure', () => {
  
  it('should have enhanced drafting service available', async () => {
    const { enhancedDraftingService } = await import('../../apps/api/src/services/enhanced-drafting-service.js');
    
    expect(enhancedDraftingService).toBeDefined();
    expect(typeof enhancedDraftingService.generateSectionDraft).toBe('function');
    expect(typeof enhancedDraftingService.generateParagraphRewrite).toBe('function');
  });
  
  it('should have enhanced retrieval service available', async () => {
    const { enhancedRetrievalService } = await import('../../apps/api/src/services/enhanced-retrieval-service.js');
    
    expect(enhancedRetrievalService).toBeDefined();
    expect(typeof enhancedRetrievalService.performEnhancedRetrieval).toBe('function');
    expect(typeof enhancedRetrievalService.analyzeQueryIntent).toBe('function');
  });
  
  it('should have enhanced prompting templates available', async () => {
    const promptingModule = await import('../../packages/prompting/src/templates/enhanced-drafting.js');
    
    expect(promptingModule.buildEnhancedDraftingPrompt).toBeDefined();
    expect(promptingModule.buildEnhancedRewritePrompt).toBeDefined();
    expect(promptingModule.ENHANCED_DRAFTING_SYSTEM_PROMPT).toBeDefined();
    expect(promptingModule.ENHANCED_REWRITE_SYSTEM_PROMPT).toBeDefined();
    expect(promptingModule.CONTEXT_WINDOW_OPTIMIZATION).toBeDefined();
  });
  
  it('should export enhanced prompting from index', async () => {
    const { 
      buildEnhancedDraftingPrompt,
      ENHANCED_DRAFTING_SYSTEM_PROMPT,
      CONTEXT_WINDOW_OPTIMIZATION 
    } = await import('../../packages/prompting/src/index.js');
    
    expect(buildEnhancedDraftingPrompt).toBeDefined();
    expect(ENHANCED_DRAFTING_SYSTEM_PROMPT).toBeDefined();
    expect(CONTEXT_WINDOW_OPTIMIZATION).toBeDefined();
  });
  
});