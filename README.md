# AI Stack Radar

A tool that combines real-time developer sentiment analysis with AI-powered architecture recommendations.

## Features

### Momentum Leaderboard

Ranks AI dev tools by real developer sentiment using:

- GitHub star velocity
- Hacker News activity
- Reddit discussions
- X (Twitter) mentions

Updated daily with automated data collection.

### Architecture Generator

Describe what you want to build and get back:

- Recommended tech stack based on live sentiment data
- Mermaid.js architecture diagram
- Step-by-step build instructions

Powered by Anthropic's Claude with live leaderboard data as context.

## Tech Stack

- **Data Collection**: Python scripts
- **Database**: Supabase
- **Automation**: GitHub Actions (daily cron jobs)
- **Frontend**: Next.js + Tailwind CSS
- **AI**: Anthropic API

## Development Roadmap

1. **Data Pipeline**: GitHub API → Supabase integration
2. **Leaderboard Frontend**: Display and visualization
3. **Architecture Generator**: AI-powered recommendations

## Project Philosophy

Open source scoring algorithm to maintain community trust and drive adoption. Deployed product provides the value-add services on top.

---

Built in public 🚀
