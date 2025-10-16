# Landing Page - Visual Structure Guide

## Page Layout Overview

```
┌────────────────────────────────────────────────────────────┐
│  🔝 TubelightNavbar (Fixed Top/Bottom)                    │
│  Home | Features | How It Works | Sign In/Workspace      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    HERO SECTION                            │
│                                                            │
│   [AI-Powered Badge]                                       │
│                                                            │
│   From Blank Page to Polished Draft                       │
│   Subtitle text explaining the value proposition          │
│                                                            │
│   [Sign in to begin ➜]  [Learn more]                      │
│                                                            │
│   🛡️ Source-Locked  🏆 Academic Integrity  👥 Trusted     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│               FEATURES SECTION (#features)                 │
│                                                            │
│   Powerful Features for Academic Success                   │
│   Subtitle about features                                  │
│                                                            │
│   ┌───────┐  ┌───────┐  ┌───────┐                        │
│   │ 🧠    │  │ 🔍    │  │ 📄    │                        │
│   │ AI    │  │Source │  │Thesis │                        │
│   │Draft  │  │Mgmt   │  │Const  │                        │
│   └───────┘  └───────┘  └───────┘                        │
│   ┌───────┐  ┌───────┐  ┌───────┐                        │
│   │ 🛡️    │  │ 🎯    │  │ ⚡    │                        │
│   │Integ  │  │Citations││ Fast  │                        │
│   │rity   │  │        │  │Iters  │                        │
│   └───────┘  └───────┘  └───────┘                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│              PROCESS SECTION (#process)                    │
│                                                            │
│   Four Guided Phases                                       │
│   Subtitle about workflow                                  │
│                                                            │
│   ┌─────────────────────┐  ┌─────────────────────┐       │
│   │ [1] 📄              │  │ [2] 🔍              │       │
│   │ Phase 1             │  │ Phase 2             │       │
│   │ Foundation          │  │ Fueling Copilot     │       │
│   │ • Setup wizard      │  │ • Upload sources    │       │
│   │ • Constitution      │  │ • Auto summaries    │       │
│   │ • Outline           │  │ • Library           │       │
│   └─────────────────────┘  └─────────────────────┘       │
│   ┌─────────────────────┐  ┌─────────────────────┐       │
│   │ [3] 📖              │  │ [4] 🏆              │       │
│   │ Phase 3             │  │ Phase 4             │       │
│   │ Writing Loop        │  │ Final Mile          │       │
│   │ • AI drafts         │  │ • Compile           │       │
│   │ • Citations         │  │ • Format            │       │
│   │ • Control           │  │ • Export            │       │
│   └─────────────────────┘  └─────────────────────┘       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│            VALUE PROPOSITION SECTION                       │
│                                                            │
│   Why Choose Thesis Copilot?                              │
│   Built on principles of academic integrity               │
│                                                            │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│   │     🛡️     │  │     📄     │  │     👥     │        │
│   │   100%     │  │Every Claim │  │Your Thesis │        │
│   │Source-Lock │  │Transparent │  │Full Control│        │
│   │Description │  │Description │  │Description │        │
│   └────────────┘  └────────────┘  └────────────┘        │
│                                                            │
│   [Additional Benefits Grid - 4 items]                    │
│   ⏱️ Save 50+ hours  📈 Iterative  🧠 Learn  🏆 Standards│
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│              TESTIMONIALS SECTION                          │
│                                                            │
│   Trusted by Graduate Students Worldwide                   │
│   See what students are saying                            │
│                                                            │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│   │ "Quote..."  │  │ "Quote..."  │  │ "Quote..."  │     │
│   │             │  │             │  │             │     │
│   │ — Sarah M.  │  │ — James L.  │  │ — Maria G.  │     │
│   │ PhD, Psych  │  │ MS, CS      │  │ PhD, Socio  │     │
│   └─────────────┘  └─────────────┘  └─────────────┘     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                 FINAL CTA SECTION                          │
│                                                            │
│   Ready to Transform Your Thesis Writing?                 │
│   Subtitle about joining other students                   │
│                                                            │
│   [Sign in to get started ➜]  [Learn more]               │
│                                                            │
│   ✓ No credit card  ✓ Free to start  ✓ Academic integrity│
└────────────────────────────────────────────────────────────┘
```

## Color Scheme

```
┌─────────────────────────────────────────────────────────┐
│  Color Token              Hex       Usage                │
├─────────────────────────────────────────────────────────┤
│  academic.background     #F8F8F7   Page background       │
│  academic.paper          #FFFFFF   Cards, sections       │
│  academic.primaryText    #2D3748   Headings, titles      │
│  academic.secondaryText  #718096   Body text, captions   │
│  academic.accent         #607A94   CTAs, icons, links    │
│  academic.border         #D1D5DB   Card borders          │
│  academic.borderLight    #E5E7EB   Subtle dividers       │
└─────────────────────────────────────────────────────────┘
```

## Typography Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  Level      Font      Size    Weight   Usage             │
├─────────────────────────────────────────────────────────┤
│  H1         Lora      4xl     Bold     Hero headline     │
│  H2         Lora      2xl     Bold     Section titles    │
│  H3         Lora      xl      Bold     Card titles       │
│  H4         Lora      md      Bold     Small headings    │
│  Body       Inter     md      Normal   Paragraphs        │
│  Small      Inter     sm      Normal   Captions          │
│  Tiny       Inter     xs      Normal   Fine print        │
└─────────────────────────────────────────────────────────┘
```

## Spacing System

```
┌─────────────────────────────────────────────────────────┐
│  Token   Pixels   Usage                                  │
├─────────────────────────────────────────────────────────┤
│  2       8px      Tight spacing (icon gaps)              │
│  3       12px     Small gaps                             │
│  4       16px     Default spacing                        │
│  6       24px     Medium spacing                         │
│  8       32px     Large spacing (card padding)           │
│  12      48px     Section spacing                        │
│  16      64px     Large section spacing                  │
│  20      80px     Extra large spacing                    │
│  24      96px     Section padding (vertical)             │
└─────────────────────────────────────────────────────────┘
```

## Icon Mapping

```
┌─────────────────────────────────────────────────────────┐
│  Section            Icon            Size                 │
├─────────────────────────────────────────────────────────┤
│  Navigation                                              │
│  • Home             Home            18px                 │
│  • Features         Sparkles        18px                 │
│  • Process          BookOpen        18px                 │
│  • Sign In          Users           18px                 │
│                                                           │
│  Features                                                │
│  • AI Drafting      Brain           24px                 │
│  • Sources          Search          24px                 │
│  • Constitution     FileText        24px                 │
│  • Integrity        Shield          24px                 │
│  • Citations        Target          24px                 │
│  • Iterations       Zap             24px                 │
│                                                           │
│  Process Phases                                          │
│  • Phase 1          FileText        20px                 │
│  • Phase 2          Search          20px                 │
│  • Phase 3          BookOpen        20px                 │
│  • Phase 4          Award           20px                 │
│                                                           │
│  Value Props                                             │
│  • Source-Locked    Shield          28px                 │
│  • Citations        FileText        28px                 │
│  • Control          Users           28px                 │
│                                                           │
│  Benefits                                                │
│  • Time             Clock           18px                 │
│  • Growth           TrendingUp      18px                 │
│  • Learning         Brain           18px                 │
│  • Standards        Award           18px                 │
│                                                           │
│  CTAs                                                    │
│  • Arrow            ArrowRight      18px                 │
│  • Check            CheckIcon       14px                 │
└─────────────────────────────────────────────────────────┘
```

## Responsive Breakpoints

```
┌─────────────────────────────────────────────────────────┐
│  Size      Min Width    Features                         │
├─────────────────────────────────────────────────────────┤
│  Mobile    0px          • Single column                  │
│                         • Icon-only nav (bottom)         │
│                         • Stacked buttons                │
│                         • Reduced font sizes             │
│                                                           │
│  Tablet    768px        • 2-column grids                 │
│                         • Text nav (top)                 │
│                         • Inline buttons                 │
│                         • Standard fonts                 │
│                                                           │
│  Desktop   1024px       • 3-column grids                 │
│                         • Full nav text                  │
│                         • Side-by-side layouts           │
│                         • Larger spacing                 │
└─────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
LandingScene
│
├── TubelightNavbar
│   ├── navItems[]
│   │   ├── Home (/)
│   │   ├── Features (#features)
│   │   ├── How It Works (#process)
│   │   └── Sign In/Workspace (conditional)
│   └── Active State Animation
│
├── Hero Section
│   ├── Badge (AI-Powered)
│   ├── Heading (H1)
│   ├── Description
│   ├── CTA Buttons (conditional)
│   └── Trust Indicators
│
├── Features Section
│   ├── Section Header
│   └── Grid (6 cards)
│       ├── Icon + Title + Description
│       └── Hover Effects
│
├── Process Section
│   ├── Section Header
│   └── Grid (4 phases)
│       ├── Phase Number + Icon
│       ├── Title + Duration
│       ├── Description
│       └── Highlights (checkmarks)
│
├── Value Proposition
│   ├── Section Header
│   ├── Main Benefits (3 items)
│   │   ├── Icon Badge
│   │   ├── Statistic
│   │   └── Description
│   └── Additional Benefits (4 cards)
│
├── Testimonials
│   ├── Section Header
│   └── Grid (3 testimonials)
│       ├── Quote (italic)
│       └── Author + Role
│
└── Final CTA
    ├── Heading
    ├── Description
    ├── CTA Buttons (conditional)
    └── Trust Badges
```

## Animation Details

```
┌─────────────────────────────────────────────────────────┐
│  Element         Type          Duration    Easing        │
├─────────────────────────────────────────────────────────┤
│  Nav Active      Spring        300ms       Stiff        │
│  Card Hover      Transition    200ms       Ease         │
│  Button Hover    Transition    200ms       Ease         │
│  Border Change   Transition    200ms       Ease         │
│  Transform       Transition    200ms       Ease         │
│  Color Change    Transition    200ms       Ease         │
└─────────────────────────────────────────────────────────┘
```

## Interaction States

```
┌─────────────────────────────────────────────────────────┐
│  Element         Default       Hover         Active      │
├─────────────────────────────────────────────────────────┤
│  Nav Item        secondary     accent        accent      │
│  Primary CTA     accent bg     darker bg     pressed     │
│  Outline CTA     border        accent bg     pressed     │
│  Feature Card    border        accent        -           │
│  Process Card    border        accent        -           │
│  Text Link       secondary     accent        -           │
└─────────────────────────────────────────────────────────┘
```

## Content Hierarchy

```
PRIMARY (Immediate attention)
├─ Hero headline
├─ Primary CTA button
└─ Badge

SECONDARY (Supporting information)
├─ Section titles
├─ Feature descriptions
├─ Process descriptions
└─ Secondary CTA

TERTIARY (Details)
├─ Body text
├─ Testimonials
├─ Trust indicators
└─ Fine print
```

## User Flow Map

```
Landing Page Entry
│
├─ [Authenticated User]
│   ├─→ Quick scan features
│   ├─→ Click "Begin onboarding"
│   └─→ OR navigate to "Workspace"
│
└─ [Unauthenticated User]
    ├─→ Read hero value proposition
    ├─→ Click "Sign in to begin"
    │   └─→ Go to /login
    ├─→ OR Click "Learn more"
    │   └─→ Scroll to #features
    │       ├─→ Read features
    │       ├─→ Read process
    │       ├─→ Read testimonials
    │       └─→ Click final CTA
    │           └─→ Go to /login
    └─→ Navigate via navbar
        ├─→ #features
        ├─→ #process
        └─→ /login
```

## Mobile vs Desktop Comparison

```
┌───────────────────────┬───────────────────────┐
│      MOBILE          │      DESKTOP          │
├───────────────────────┼───────────────────────┤
│ Nav at bottom        │ Nav at top            │
│ Icon-only nav        │ Text labels nav       │
│ 1-column grids       │ 2-3 column grids      │
│ Stacked CTAs         │ Inline CTAs           │
│ Smaller fonts        │ Larger fonts          │
│ Reduced spacing      │ Generous spacing      │
│ Touch targets 48px+  │ Mouse targets 40px+   │
│ Thumb zone friendly  │ Full width usage      │
└───────────────────────┴───────────────────────┘
```

---

This visual guide provides a complete overview of the landing page structure, 
design system, and user interactions at a glance.
