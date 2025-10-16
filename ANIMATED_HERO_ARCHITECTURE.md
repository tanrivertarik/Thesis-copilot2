# Animated Hero - Component Structure

## 📦 File Tree

```
apps/web/src/
├── components/ui/
│   ├── AnimatedHero.tsx          ← New animated hero component
│   ├── Button.tsx                 ← New hybrid button component
│   └── TubelightNavbar.tsx        ← Existing navbar
├── routes/home/
│   └── LandingScene.tsx           ← Modified to use AnimatedHero
├── app/providers/firebase/
│   └── AuthProvider.tsx           ← Auth context
└── theme/
    └── index.ts                   ← Academic color tokens
```

## 🔧 Component Architecture

### AnimatedHero.tsx Structure
```tsx
AnimatedHero
├── State Management
│   ├── useAuth() → isAuthenticated
│   ├── useState(titleNumber)
│   └── useMemo(titles array)
│
├── Effects
│   └── useEffect → setTimeout cycle
│
└── Render
    ├── Container (Chakra)
    ├── VStack (vertical layout)
    │   ├── Badge Button
    │   ├── Animated Heading
    │   │   ├── Static text: "Your thesis writing is"
    │   │   └── Animated Container
    │   │       └── map(titles) → motion.span
    │   ├── Description Text
    │   └── CTA Buttons (HStack)
    │       ├── Learn More (outline)
    │       └── Primary CTA (solid, auth-aware)
```

## 🎯 Key Components

### 1. State & Logic Layer
```typescript
// Auth detection
const { user } = useAuth();
const isAuthenticated = Boolean(user);

// Animation state
const [titleNumber, setTitleNumber] = useState(0);
const titles = useMemo(
  () => ["powerful", "intelligent", "reliable", "innovative", "scholarly"],
  []
);

// Cycle effect
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (titleNumber === titles.length - 1) {
      setTitleNumber(0);
    } else {
      setTitleNumber(titleNumber + 1);
    }
  }, 2000);
  return () => clearTimeout(timeoutId);
}, [titleNumber, titles]);
```

### 2. Animation Layer
```typescript
{titles.map((title, index) => (
  <motion.span
    key={index}
    style={{
      position: "absolute",
      fontWeight: 600,
      color: "#2D3748",
    }}
    initial={{ opacity: 0, y: "-100" }}
    transition={{ type: "spring", stiffness: 50 }}
    animate={
      titleNumber === index
        ? { y: 0, opacity: 1 }         // Current word
        : {
            y: titleNumber > index ? -150 : 150,  // Previous/next
            opacity: 0,
          }
    }
  >
    {title}
  </motion.span>
))}
```

### 3. UI Layer (Chakra Components)
```typescript
<Box w="full" bg="academic.background">
  <Container maxW="container.xl">
    <VStack gap={8} py={{ base: 20, lg: 40 }}>
      {/* Badge */}
      <Button variant="ghost" size="sm" ...props>
        AI-Powered Academic Writing
      </Button>
      
      {/* Heading with animation */}
      <Heading fontSize={{ base: "5xl", md: "7xl" }}>
        <Text as="span" color="academic.accent">
          Your thesis writing is
        </Text>
        <Box position="relative" minH={{ base: "60px", md: "80px" }}>
          {/* Animated words here */}
        </Box>
      </Heading>
      
      {/* Description */}
      <Text fontSize={{ base: "lg", md: "xl" }}>
        From blank page to polished draft...
      </Text>
      
      {/* CTAs */}
      <HStack spacing={3}>
        <Button variant="outline">Learn more</Button>
        <Button>
          {isAuthenticated ? "Start writing" : "Sign in to begin"}
        </Button>
      </HStack>
    </VStack>
  </Container>
</Box>
```

## 🎨 Styling Architecture

### Color System
```typescript
// Defined in /apps/web/src/theme/index.ts
const colors = {
  academic: {
    background: "#F8F8F7",      // Page background
    paper: "#FFFFFF",            // Card backgrounds
    primaryText: "#2D3748",      // Headings
    secondaryText: "#718096",    // Body text
    accent: "#607A94",           // Interactive elements
    border: "#D1D5DB",           // Borders
    borderLight: "#E5E7EB",      // Subtle dividers
  }
};
```

### Typography System
```typescript
// Heading
fontFamily: "Lora"                    // Serif for elegance
fontSize: { base: "5xl", md: "7xl" }  // Responsive sizing
fontWeight: "normal"                   // Not too bold
lineHeight: "1.1"                      // Tight for impact

// Body text
fontFamily: "Inter"                    // Sans-serif for readability
fontSize: { base: "lg", md: "xl" }    // Comfortable reading size
color: "academic.secondaryText"        // Softer than black
```

### Spacing System
```typescript
// Container
maxW: "container.xl"                   // Chakra's XL breakpoint

// Vertical spacing
py: { base: 20, lg: 40 }              // Padding: 80px → 160px

// Element gaps
gap: 8                                 // 32px between elements
spacing: 3                             // 12px between buttons
```

## 🔀 Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                  User Visits Page                   │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│              LandingScene Renders                    │
│  - Mounts TubelightNavbar                           │
│  - Mounts AnimatedHero                              │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│           AnimatedHero Initializes                   │
│  1. Calls useAuth() → gets user status              │
│  2. Sets titleNumber = 0                            │
│  3. Creates titles array                            │
│  4. Starts useEffect timer                          │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│              Animation Loop Starts                   │
│  Every 2 seconds:                                   │
│  1. Increment titleNumber (or reset to 0)           │
│  2. Trigger Framer Motion animation                 │
│  3. Current word slides to y: 0, opacity: 1         │
│  4. Other words slide out with opacity: 0           │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│               User Interactions                      │
│  - Click badge → scroll to #features                │
│  - Click "Learn more" → scroll to #features         │
│  - Click primary CTA → route based on auth          │
│    • Logged in  → /onboarding                       │
│    • Logged out → /login                            │
└─────────────────────────────────────────────────────┘
```

## 🧩 Dependencies Graph

```
AnimatedHero.tsx
│
├─── React
│    ├── useEffect (animation timer)
│    ├── useMemo (titles array)
│    └── useState (current word index)
│
├─── Framer Motion
│    ├── motion (animated span)
│    └── spring animations
│
├─── Chakra UI
│    ├── Box (containers)
│    ├── Container (max-width wrapper)
│    ├── VStack (vertical layout)
│    ├── HStack (horizontal layout)
│    ├── Heading (title)
│    ├── Text (body)
│    └── Button (CTAs)
│
├─── React Router
│    └── Link (routing)
│
├─── Lucide React
│    ├── MoveRight (arrow icon)
│    └── BookOpen (book icon)
│
└─── Custom
     └── AuthProvider (user state)
```

## 📊 Component Props Flow

```typescript
// AnimatedHero has NO props (self-contained)
<AnimatedHero />

// Internal prop flow:
AnimatedHero
  ├→ useAuth() → { user }
  │   └→ Boolean(user) → isAuthenticated
  │
  ├→ Button (Badge)
  │   ├─ variant: "ghost"
  │   ├─ size: "sm"
  │   ├─ as: RouterLink
  │   └─ to: "#features"
  │
  ├→ motion.span (each word)
  │   ├─ key: index
  │   ├─ initial: { opacity: 0, y: "-100" }
  │   ├─ transition: { type: "spring", stiffness: 50 }
  │   └─ animate: computed from titleNumber
  │
  ├→ Button (Learn more)
  │   ├─ variant: "outline"
  │   ├─ size: "lg"
  │   ├─ as: RouterLink
  │   └─ to: "#features"
  │
  └→ Button (Primary CTA)
      ├─ size: "lg"
      ├─ as: RouterLink
      ├─ to: isAuthenticated ? "/onboarding" : "/login"
      └─ children: isAuthenticated ? "Start writing" : "Sign in to begin"
```

## 🎭 Animation State Machine

```
State: titleNumber

┌─────────┐  2s timeout  ┌─────────┐  2s timeout  ┌─────────┐
│    0    │─────────────→│    1    │─────────────→│    2    │
│"powerful"│              │"intel..." │             │"reliable"│
└─────────┘              └─────────┘              └─────────┘
     ↑                                                   │
     │                                              2s timeout
     │                                                   ↓
┌─────────┐  2s timeout  ┌─────────┐              ┌─────────┐
│    4    │←─────────────│    3    │←─────────────│         │
│"scholarly"│             │"innov..." │             │         │
└─────────┘              └─────────┘              └─────────┘
     │                                                        
     └───────── Loops back to 0 ──────────────────────────────┘
```

## 🔍 Render Cycle

```
Initial Render (titleNumber = 0)
├─ "powerful" → { y: 0, opacity: 1 } (visible)
├─ "intelligent" → { y: 150, opacity: 0 } (below)
├─ "reliable" → { y: 150, opacity: 0 } (below)
├─ "innovative" → { y: 150, opacity: 0 } (below)
└─ "scholarly" → { y: 150, opacity: 0 } (below)

After 2s (titleNumber = 1)
├─ "powerful" → { y: -150, opacity: 0 } (slides up & fades)
├─ "intelligent" → { y: 0, opacity: 1 } (slides in & appears)
├─ "reliable" → { y: 150, opacity: 0 } (still below)
├─ "innovative" → { y: 150, opacity: 0 } (still below)
└─ "scholarly" → { y: 150, opacity: 0 } (still below)

After 4s (titleNumber = 2)
├─ "powerful" → { y: -150, opacity: 0 }
├─ "intelligent" → { y: -150, opacity: 0 } (slides up)
├─ "reliable" → { y: 0, opacity: 1 } (slides in)
├─ "innovative" → { y: 150, opacity: 0 }
└─ "scholarly" → { y: 150, opacity: 0 }
```

## 🎨 Visual Hierarchy

```
Z-Index / Layer Stack
═════════════════════════════════════════════

Layer 5: TubelightNavbar (fixed, z-index: 999)
─────────────────────────────────────────────
Layer 4: Buttons (interactive elements)
─────────────────────────────────────────────
Layer 3: Animated text (position: absolute)
─────────────────────────────────────────────
Layer 2: Static content (headings, text)
─────────────────────────────────────────────
Layer 1: Background (academic.background)
═════════════════════════════════════════════
```

## 📱 Responsive Tokens

```typescript
// Chakra UI responsive syntax
{ base: value1, md: value2, lg: value3 }
//  ↑      ↑       ↑      ↑       ↑     ↑
//  0px    mobile  768px  tablet  1024px desktop

Examples:
py={{ base: 20, lg: 40 }}
// Mobile/Tablet: 80px padding
// Desktop: 160px padding

fontSize={{ base: "5xl", md: "7xl" }}
// Mobile: 48px
// Tablet+: 72px
```

## 🧪 Testing Strategy

```
Unit Tests (Potential)
├─ titleNumber cycles correctly (0 → 1 → 2 → 3 → 4 → 0)
├─ Auth detection works (isAuthenticated logic)
└─ Button routing changes based on auth

Integration Tests (Potential)
├─ AnimatedHero renders without crash
├─ All 5 words render in DOM
└─ Buttons have correct href/to attributes

Manual Tests (Required)
├─ Visual: Animation looks smooth
├─ Visual: Spring effect is natural
├─ Interaction: Badge scrolls to #features
├─ Interaction: "Learn more" scrolls to #features
├─ Interaction: Primary CTA routes correctly
└─ Responsive: Works on mobile, tablet, desktop
```

---

**This structure makes it easy to:**
- 🔍 Understand how data flows
- 🎨 Customize colors and typography
- ⚡ Modify animation behavior
- 🐛 Debug issues
- 📚 Onboard new developers
