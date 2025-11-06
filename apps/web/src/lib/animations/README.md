# Thesis Copilot Animation System

A comprehensive, production-ready animation library built on Framer Motion. Designed for academic elegance: subtle, purposeful, and performance-optimized.

## 📚 Table of Contents

- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Components](#components)
- [Hooks](#hooks)
- [Presets & Variants](#presets--variants)
- [Utilities](#utilities)
- [Best Practices](#best-practices)
- [Live Demo](#live-demo)

---

## 🚀 Quick Start

### Installation

The animation system is already integrated into the project. Simply import what you need:

```tsx
import { FadeIn, SlideUp, StaggerContainer } from '@/lib/animations';
```

### Basic Usage

```tsx
import { FadeIn } from '@/lib/animations';

function MyComponent() {
  return (
    <FadeIn>
      <Card>This content fades in smoothly on mount</Card>
    </FadeIn>
  );
}
```

### Live Demo

Visit `/animation-showcase` in your browser to see all animations in action with interactive examples and code snippets.

---

## 🎯 Core Concepts

### Design Principles

1. **Academic Elegance** - Subtle, professional animations that don't distract
2. **Performance First** - Only animate `transform` and `opacity` properties
3. **Purposeful Motion** - Every animation serves a clear UX purpose
4. **Consistent Timing** - Standardized durations and easing curves
5. **Accessible** - Respects `prefers-reduced-motion` user preferences

### Timing Standards

```typescript
timing.instant  // 0.1s - Quick micro-interactions
timing.fast     // 0.2s - Standard transitions
timing.normal   // 0.3s - Default animation duration
timing.slow     // 0.4s - Attention-grabbing entrances
timing.slower   // 0.6s - Premium, deliberate animations
```

### Easing Curves

```typescript
easing.ease       // [0.4, 0, 0.2, 1] - Standard Material Design
easing.smooth     // [0.45, 0, 0.55, 1] - Very smooth
easing.snappy     // [0.25, 0.1, 0.25, 1] - Quick response
```

---

## 🧩 Components

Pre-built animated components that you can drop into your JSX.

### Basic Animations

#### FadeIn
Smoothly fades in content on mount.

```tsx
<FadeIn>
  <Card>Content fades in</Card>
</FadeIn>
```

#### SlideUp, SlideDown, SlideLeft, SlideRight
Slides content in from the specified direction with fade.

```tsx
<SlideUp>
  <Alert>Slides up from bottom</Alert>
</SlideUp>
```

#### ScaleUp
Scales content from 90% to 100% with fade.

```tsx
<ScaleUp>
  <Modal>Modal scales up smoothly</Modal>
</ScaleUp>
```

### Premium Animations

#### PremiumEntrance
Combines scale, slide, and fade for high-impact entrances.

```tsx
<PremiumEntrance>
  <Hero>Welcome message with premium feel</Hero>
</PremiumEntrance>
```

#### BlurFade
Animates from blurred to sharp (glassmorphism effect).

```tsx
<BlurFade>
  <Card>Blur to focus transition</Card>
</BlurFade>
```

### Stagger Animations

#### StaggerContainer + StaggerItem
Animate lists with cascading delays.

```tsx
<StaggerContainer staggerDelay={0.05}>
  {projects.map(project => (
    <StaggerItem key={project.id}>
      <ProjectCard {...project} />
    </StaggerItem>
  ))}
</StaggerContainer>
```

#### AnimatedList
Shorthand for staggered lists.

```tsx
<AnimatedList
  items={projects}
  renderItem={(project) => <ProjectCard {...project} />}
  staggerDelay={0.08}
/>
```

### Scroll Animations

#### ScrollFadeIn
Fades in when scrolled into viewport.

```tsx
<ScrollFadeIn once={true} margin="-50px">
  <Section>Appears when scrolling</Section>
</ScrollFadeIn>
```

#### ScrollScaleIn
Scales up when scrolled into viewport.

```tsx
<ScrollScaleIn>
  <FeatureCard>Scales in on scroll</FeatureCard>
</ScrollScaleIn>
```

### Interactive Components

#### AnimatedButton
Button with hover and tap feedback.

```tsx
<AnimatedButton onClick={handleClick}>
  Click me
</AnimatedButton>
```

#### AnimatedCard
Card with hover lift effect.

```tsx
<AnimatedCard enableHover>
  <CardContent />
</AnimatedCard>
```

### Special Effects

#### AnimatedCounter
Smoothly animates number changes.

```tsx
<AnimatedCounter
  value={42}
  duration={1000}
  prefix="$"
  suffix="%"
  decimals={2}
/>
```

#### Typewriter
Typewriter text effect.

```tsx
<Typewriter
  text="Hello, world!"
  speed={50}
  delay={300}
  onComplete={() => console.log('Done!')}
/>
```

### Page Transitions

#### AnimatedPage
Wraps page content with transition animation.

```tsx
<AnimatedPage>
  <PageContent />
</AnimatedPage>
```

**For Router Integration:**

```tsx
import { AnimatePresence } from 'framer-motion';
import { useLocation, Routes, Route } from 'react-router-dom';

function AppRouter() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* routes */}
      </Routes>
    </AnimatePresence>
  );
}
```

---

## 🎣 Hooks

Custom React hooks for animation control.

### useScrollAnimation
Detect when element enters viewport.

```tsx
const { ref, inView } = useScrollAnimation({
  threshold: 0.3,
  triggerOnce: true,
  rootMargin: '-50px'
});

return (
  <div ref={ref} style={{ opacity: inView ? 1 : 0 }}>
    Content
  </div>
);
```

### useMountAnimation
Trigger animation on component mount.

```tsx
const isMounted = useMountAnimation();

return (
  <motion.div animate={isMounted ? 'visible' : 'hidden'}>
    Content
  </motion.div>
);
```

### useChangeAnimation
Pulse animation when value changes.

```tsx
const hasChanged = useChangeAnimation(count, 500);

return (
  <motion.div animate={{ scale: hasChanged ? 1.1 : 1 }}>
    {count}
  </motion.div>
);
```

### useHover
Track hover state.

```tsx
const [ref, isHovered] = useHover<HTMLDivElement>();

return (
  <div ref={ref}>
    {isHovered ? '🎉' : '👋'}
  </div>
);
```

### useLoadingAnimation
Smooth loading state (prevents flashing).

```tsx
const smoothLoading = useLoadingAnimation(isLoading, 300);

return smoothLoading ? <Spinner /> : <Content />;
```

### usePrefersReducedMotion
Respect user's motion preferences.

```tsx
const prefersReducedMotion = usePrefersReducedMotion();

return (
  <motion.div animate={prefersReducedMotion ? {} : { scale: 1.1 }}>
    Content
  </motion.div>
);
```

---

## 🎨 Presets & Variants

Direct access to animation variants for manual control.

### Using Presets with motion.div

```tsx
import { motion } from 'framer-motion';
import { fadeIn, slideUp, staggerContainer } from '@/lib/animations';

function MyComponent() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
    >
      Content
    </motion.div>
  );
}
```

### Available Presets

**Basic:**
- `fadeIn` - Simple fade
- `slideUp`, `slideDown`, `slideLeft`, `slideRight` - Directional slides
- `scaleUp`, `scaleDown` - Scale animations

**Combined:**
- `premiumEntrance` - Scale + slide + fade
- `blurFade` - Blur + fade

**Stagger:**
- `staggerContainer` - Parent container
- `staggerItem` - Child items

**Scroll:**
- `scrollFadeIn` - Scroll-triggered fade
- `scrollScaleIn` - Scroll-triggered scale

**Micro-interactions:**
- `buttonPress` - Button feedback
- `cardHover` - Card lift
- `shake` - Error shake
- `pulse` - Notification pulse
- `spin` - Loading spinner

**Special:**
- `cursorBlink` - Typewriter cursor
- `checkmarkReveal` - Success animation
- `progressFill` - Progress bar
- `collapse` - Collapse/expand

---

## 🛠️ Utilities

Helper functions for advanced use cases.

### Variant Generators

Create custom animation variants programmatically.

```tsx
import { createSlideVariants, createStaggerVariants } from '@/lib/animations';

const customSlide = createSlideVariants('up', 30, 0.4);
const customStagger = createStaggerVariants(0.1, 0.2);
```

### Animation Orchestration

```tsx
import { calculateStaggerDuration } from '@/lib/animations';

// Calculate total duration for 10 items
const duration = calculateStaggerDuration(10, 0.3, 0.05, 0.1);
// Returns: 3550ms
```

### Scroll Calculations

```tsx
import { calculateScrollProgress, interpolateScroll } from '@/lib/animations';

const progress = calculateScrollProgress(element, 50);
const opacity = interpolateScroll(progress, 0, 1);
```

### Easing Functions

```tsx
import { easeOutCubic, lerp } from '@/lib/animations';

const value = easeOutCubic(0.5); // Apply easing
const interpolated = lerp(0, 100, 0.5); // Linear interpolation
```

---

## ✅ Best Practices

### 1. Performance

**DO:**
```tsx
// Only animate transform and opacity
<motion.div animate={{ opacity: 1, scale: 1 }} />
```

**DON'T:**
```tsx
// Avoid animating layout properties
<motion.div animate={{ width: '100%', height: '200px' }} />
```

### 2. Timing

**DO:**
```tsx
// Use standard timing values
import { timing } from '@/lib/animations';
transition={{ duration: timing.normal }}
```

**DON'T:**
```tsx
// Avoid arbitrary timing
transition={{ duration: 0.273 }}
```

### 3. Stagger

**DO:**
```tsx
// Use StaggerContainer for lists
<StaggerContainer>
  {items.map(item => <StaggerItem key={item.id}>...</StaggerItem>)}
</StaggerContainer>
```

**DON'T:**
```tsx
// Don't manually calculate delays
{items.map((item, i) => (
  <motion.div animate={{ delay: i * 0.1 }}>...</motion.div>
))}
```

### 4. Accessibility

**DO:**
```tsx
// Respect reduced motion preference
const animation = useAccessibleAnimation({ scale: 1.1 });
```

**DON'T:**
```tsx
// Don't ignore user preferences
<motion.div animate={{ scale: 1.1 }} /> // Always animates
```

### 5. Exit Animations

**DO:**
```tsx
// Wrap with AnimatePresence for exit animations
<AnimatePresence mode="wait">
  {show && <FadeIn>Content</FadeIn>}
</AnimatePresence>
```

**DON'T:**
```tsx
// Exit animations won't work without AnimatePresence
{show && <FadeIn>Content</FadeIn>}
```

---

## 📖 Common Patterns

### Pattern 1: Page Transitions

```tsx
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { AnimatedPage } from '@/lib/animations';

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <AnimatedPage>
            <HomePage />
          </AnimatedPage>
        } />
      </Routes>
    </AnimatePresence>
  );
}
```

### Pattern 2: Conditional Content

```tsx
import { AnimatePresence } from 'framer-motion';
import { FadeIn } from '@/lib/animations';

function ConditionalContent({ show, children }) {
  return (
    <AnimatePresence mode="wait">
      {show && <FadeIn>{children}</FadeIn>}
    </AnimatePresence>
  );
}
```

### Pattern 3: Loading States

```tsx
import { useLoadingAnimation } from '@/lib/animations';

function DataFetcher() {
  const { data, isLoading } = useQuery(...);
  const smoothLoading = useLoadingAnimation(isLoading, 300);

  if (smoothLoading) return <Spinner />;
  return <DataDisplay data={data} />;
}
```

### Pattern 4: Dashboard Cards

```tsx
import { StaggerContainer, StaggerItem, AnimatedCard } from '@/lib/animations';

function Dashboard({ projects }) {
  return (
    <StaggerContainer staggerDelay={0.05}>
      {projects.map(project => (
        <StaggerItem key={project.id}>
          <AnimatedCard enableHover>
            <ProjectCard {...project} />
          </AnimatedCard>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
```

### Pattern 5: Success Feedback

```tsx
import { useChangeAnimation } from '@/lib/animations';
import { motion } from 'framer-motion';

function SaveButton() {
  const [saved, setSaved] = useState(false);
  const hasChanged = useChangeAnimation(saved, 500);

  return (
    <motion.button
      animate={{
        scale: hasChanged ? 1.1 : 1,
        backgroundColor: saved ? '#48BB78' : '#607A94'
      }}
      onClick={() => setSaved(true)}
    >
      {saved ? '✓ Saved' : 'Save'}
    </motion.button>
  );
}
```

---

## 🎬 Live Demo

Visit the interactive showcase page to see all animations in action:

```
http://localhost:5173/animation-showcase
```

The showcase includes:
- Live animation previews
- Interactive controls to replay animations
- Copy-paste code examples
- Timing reference chart
- Quick start snippets

---

## 🐛 Troubleshooting

### Exit animations not working

**Problem:** Component disappears instantly instead of animating out.

**Solution:** Wrap with `AnimatePresence`:

```tsx
<AnimatePresence mode="wait">
  {show && <FadeIn>Content</FadeIn>}
</AnimatePresence>
```

### Stagger animation not cascading

**Problem:** All items animate at once instead of staggering.

**Solution:** Ensure you're using both `StaggerContainer` and `StaggerItem`:

```tsx
<StaggerContainer>
  {items.map(item => (
    <StaggerItem key={item.id}>  {/* Don't forget StaggerItem! */}
      <Card />
    </StaggerItem>
  ))}
</StaggerContainer>
```

### Performance issues

**Problem:** Animations are janky or laggy.

**Solution:** Only animate `transform` and `opacity`:

```tsx
// ✓ Good - GPU accelerated
<motion.div animate={{ scale: 1, opacity: 1 }} />

// ✗ Bad - Forces layout recalculation
<motion.div animate={{ width: '100%' }} />
```

### TypeScript errors

**Problem:** TypeScript complains about motion component props.

**Solution:** Use proper types from Framer Motion:

```tsx
import { HTMLMotionProps } from 'framer-motion';

type MyProps = HTMLMotionProps<'div'> & {
  customProp: string;
};
```

---

## 📚 Additional Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Material Design Motion](https://material.io/design/motion)
- [Animation Principles](https://www.interaction-design.org/literature/article/12-principles-of-animation)
- [Reduced Motion](https://web.dev/prefers-reduced-motion/)

---

## 🤝 Contributing

When adding new animations:

1. Add preset to `presets.ts`
2. Create component wrapper in `components.tsx`
3. Add utility function to `utils.ts` if needed
4. Export from `index.ts`
5. Add demo to `AnimationShowcase.tsx`
6. Update this README

---

## 📝 License

Part of the Thesis Copilot project.
