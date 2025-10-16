# Thesis Copilot - Visual Journey Guide

## User Experience Flow: From Blank Page to Polished Draft

### 🏠 Landing Page
**What the user sees**: Modern hero section with clear value proposition

**Design Elements**:
- Large gradient heading: "From Blank Page to Polished Draft"
- Subheading explaining the copilot approach
- 4-phase grid showing each phase with:
  - Numbered badge (1, 2, 3, 4)
  - Phase title and duration
  - Description
  - 3 key highlights (with checkmark icons)
- Value proposition section with icons
- Clear CTA: "Sign in to begin" or "Begin onboarding"

**Color Scheme**: 
- Hero background: Subtle gradient overlay
- Phase cards: Dark with border accent on hover
- Buttons: Blue-to-purple gradient

---

### 📋 Onboarding Overview
**What the user sees**: 3-step timeline with progress tracking

**Design Elements**:
- Title: "Begin Your Journey"
- "What is a Thesis Constitution?" info box
- 3 clickable steps in timeline format:
  1. ✓ Project Basics (3-5 min)
  2. ⏱ Research Inputs (5-10 min)  
  3. ⏱ Review & Generate (1-2 min)
- Step details on hover/click
- Action buttons: "Start questionnaire", "Skip to workspace"

**Color Scheme**:
- Timeline numbers: Gradient badge
- Completed steps: Green checkmark
- Info box: Gradient background

---

### 📝 Step 1: Project Details
**What the user sees**: Guided form for thesis basics

**Form Fields** (in order):
1. 📚 **Thesis Title**
   - Placeholder: "e.g., The Impact of Social Media on Community Engagement"
   - Help text: "A clear, concise title for your research project"

2. 🔍 **Topic Description**
   - Placeholder: "Describe what your thesis is about..."
   - Help text: "1-2 sentences summarizing your research focus"

3. ❓ **Core Research Questions**
   - Placeholder: "E.g.: How does social media correlate with engagement?"
   - Help text: "💡 Tip: Focus on 2–4 questions to start"

4. ✨ **Working Thesis Statement** (Optional)
   - Placeholder: "Your preliminary main argument..."
   - Help text: "Optional, but helpful for Constitution generation"

5. 📋 **Citation Style**
   - Dropdown: APA, MLA, CHICAGO, IEEE, HARVARD
   - Help text: "Choose your preferred citation format"

**Design Details**:
- Info box: "These details guide your Thesis Constitution"
- Each field has emoji icon for quick scanning
- Clear distinction between required and optional fields
- Error alerts in red with specific messages
- Buttons: "Save & Continue", "Back"

---

### 📚 Step 2: Research Inputs
**What the user sees**: Source upload interface

**Design Elements**:
- Info box: "Why add initial sources?" with bullet points
- Drag-drop zone (visual indicator with dashed border)
- Two input fields:
  1. Source Title: "e.g., Smith et al. (2023) - Social Media Effects"
  2. Source Text: Large textarea with dashed border that changes color on input

**Visual Feedback**:
- Default: Gray dashed border
- With text: Blue dashed border (showing engagement)
- Success: Green alert with "✓ Source ingested successfully"
- Error: Red alert with specific error message

**Action Buttons**:
- "Add source & continue" (if text present)
- "Continue without sources" (if empty)
- "Back" (navigation)

**Help Text**:
- "💡 Tip: Quality over quantity. One strong source is better than generic text."
- "What happens next" section explaining ingestion process

---

### ✅ Step 3: Review & Generate
**What the user sees**: Project summary before Constitution generation

**Sections**:

1. **Your Project Card**
   - ✓ Badge with icon
   - Grid layout showing:
     - Thesis Title
     - Citation Style
     - Topic Description
   - List of Research Questions
   - Edit button to go back

2. **Research Sources Card**
   - Status indicator: ✓ or ℹ️ icon
   - If sources added:
     - ✓ Success alert showing chunks created
     - Abstract preview (truncated)
     - "Add another source" button
   - If no sources:
     - ℹ️ Info alert explaining optional nature
     - "Add a source now" button

3. **What Happens Next**
   - Gradient info box with rocket emoji
   - Bullet points:
     - Analyzes project details and sources
     - Generates custom Constitution
     - Creates outline
     - Unlocks workspace

**Action Buttons**:
- "Create Constitution & Continue" (with loading spinner)
- "Back to sources"

---

### ✨ Key Visual Features

#### Color Palette in Use
| Element | Color | Purpose |
|---------|-------|---------|
| Primary buttons | Blue-to-purple gradient | Call-to-action |
| Background | Dark gradient (#0a0e27) | Eye strain reduction |
| Success alerts | Green overlay | Positive feedback |
| Info boxes | Blue overlay gradient | Contextual help |
| Cards | Dark (#0f1729) | Content containers |
| Borders | Blue-transparent | Visual separation |

#### Interactive States
- **Button Hover**: Lifts up, shadow appears
- **Input Focus**: Border glows blue, shadow appears
- **Card Hover**: Background slightly lighter, border brightens
- **Text Selected**: Blue highlight (#3f52d9)

#### Spacing Pattern
- Section spacing: 2.5rem (large gaps between major sections)
- Field spacing: 2rem (between form groups)
- Padding: 1.5rem inside cards
- Margins: 1rem between inline elements

---

### 📱 Responsive Breakpoints

**Mobile (< 768px)**:
- Single column layout
- Full-width buttons
- Smaller text sizes
- Stacked form fields
- Compact spacing

**Tablet (≥ 768px)**:
- 2-column grids for phases
- Side-by-side buttons
- Balanced padding
- Better utilization of screen width

**Desktop (≥ 992px)**:
- 3-4 column grids
- Full sidebar layouts possible
- Generous padding
- Maximum content width

---

### 🎨 Typography Hierarchy

**Page Titles**: size="3xl" with gradient text
- Example: "From Blank Page to Polished Draft"

**Section Titles**: size="2xl"
- Example: "Begin Your Journey"

**Card Titles**: size="md"
- Example: "Your Project"

**Field Labels**: fontWeight="semibold", color="blue.50"
- Example: "📚 Thesis Title"

**Help Text**: fontSize="sm", color="blue.300"
- Example: "A clear, concise title for your research project"

**Placeholder Text**: color="blue.600"
- Lighter than regular text for visual distinction

---

### ♿ Accessibility Features

✅ **Color Contrast**
- All text meets WCAG AA standards
- Blue (#5b82f5) on dark (#0f1729) = 11.5:1 ratio

✅ **Semantic HTML**
- Proper heading hierarchy (h1 → h3)
- Form labels associated with inputs
- Buttons properly labeled

✅ **Focus States**
- All interactive elements have visible focus rings
- Focus order is logical and intuitive
- Color not sole indicator of state

✅ **Readability**
- Inter font stack ensures clarity
- Line height provides comfortable reading
- Text sizes scale appropriately

---

### 🎯 Success Indicators

**Phase 1 Complete When**:
- Thesis title filled
- Topic description completed
- Project saved (visible in breadcrumb)

**Phase 2 Complete When**:
- Source ingested successfully
- Green alert shows chunk count
- Abstract captured (if available)

**Phase 3 Ready When**:
- Constitution generated
- Workspace unlocked
- Outline visible in dashboard

---

### 💡 User Psychology Principles Applied

1. **Progressive Disclosure**: Show only what's needed at each step
2. **Immediate Feedback**: Users know actions were received
3. **Clear Affordances**: Buttons look clickable, inputs look editable
4. **Logical Flow**: Questions build on each other
5. **Reassurance**: Info boxes explain "why" and "what's next"
6. **Visual Hierarchy**: Important things are visually prominent
7. **Error Prevention**: Required fields marked clearly
8. **Recovery**: Easy navigation backward if user changes mind

---

This visual design creates a **professional, trustworthy atmosphere** that makes thesis writing feel manageable and supported, not overwhelming.
