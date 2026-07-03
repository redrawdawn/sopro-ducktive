# Motive

Motive is a mobile-first gamified productivity app for turning real-life goals, chores, habits, and routines into daily, weekly, monthly, and yearly progress.

Mo is the short name for the app. Character cosmetics, streak rewards, seasonal achievements, and deeper progression are intentionally left for future versions.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Supabase Auth and Postgres
- Vercel deployment support

## Features in This Foundation

- Email/password auth screens
- Mobile-first dashboard
- Quest, achievement, XP progress, level badge, navigation, and dashboard widget components
- Configurable XP and level helpers
- Supabase schema for users, households, members, quests, completions, achievements, user achievements, and XP transactions
- Row Level Security policies for authenticated users and household-scoped access
- Sample achievements:
  - First Quest Completed
  - Reach Level 5
  - Reach Level 10
  - Complete 7 Daily Quests
  - Complete 30 Quests
  - Earn 1,000 XP

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Create a Supabase project and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

4. Apply the database migration in `supabase/migrations/0001_initial_schema.sql` using the Supabase SQL editor or Supabase CLI:

```bash
supabase db push
```

5. Run the app:

```bash
npm run dev
```

## Supabase Notes

Enable email/password authentication in Supabase Authentication settings. For local development, add `http://localhost:3000` to the allowed redirect URLs. For production, add your Vercel domain.

The migration creates a `public.users` profile table linked to `auth.users`, household membership tables, quest data, XP transactions, achievement definitions, and automatic achievement evaluation helpers.

## Vercel Deployment

1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Add the same Supabase environment variables in Vercel Project Settings.
4. Deploy.
5. Add the deployed Vercel URL to Supabase Authentication redirect URLs.

## Product Boundaries

Version 1 intentionally avoids AI features, notifications, purchases, ads, social feeds, and chat. The focus is a strong productivity foundation with RPG-inspired progression.
