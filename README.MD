# AtlasAI - Flask + Supabase Version

A Python Flask-based internal wiki system with AI assistant capabilities, powered by Supabase.

## Features

- **Wiki Management**: Create, edit, and organize wiki pages in a hierarchy
- **AI Assistant**: Ask questions and get intelligent answers based on your wiki content
- **Vector Search**: Uses OpenAI embeddings with Supabase pgvector for semantic search
- **Cloud Database**: Powered by Supabase PostgreSQL with automatic scaling
- **Responsive Design**: Works on desktop and mobile devices
- **Simple Setup**: No local database installation required

## Requirements

- Python 3.8+
- Supabase account (free tier available)
- OpenAI API key

## Quick Setup

1. **Clone and install dependencies**:
   \`\`\`bash
   git clone <your-repo>
   cd atlasai-flask-supabase
   pip install -r requirements.txt
   \`\`\`

2. **Create Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API keys

3. **Configure environment**:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your Supabase and OpenAI credentials
   \`\`\`

4. **Setup database tables**:
   \`\`\`bash
   python setup_supabase.py
   \`\`\`
   This will show you the SQL script to run in your Supabase dashboard.

5. **Run the application**:
   \`\`\`bash
   python app.py
   \`\`\`

6. **Access AtlasAI**:
   Open http://localhost:5000 in your browser

## Environment Variables

Create a `.env` file with:

\`\`\`bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Flask Configuration
SECRET_KEY=your-secret-key-here
\`\`\`

## Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL script provided by `python setup_supabase.py`
4. This creates all necessary tables and the vector search function

## Usage

- **Create Pages**: Click "Create Page" to add new wiki content
- **Edit Pages**: Click "Edit" on any page to modify content
- **AI Assistant**: Use the chat panel on the right to ask questions
- **Search**: Use the search box in the sidebar to find pages
- **Organize**: Set parent pages to create a hierarchy

## Features

### Wiki System
- Hierarchical page organization
- Markdown content support
- Real-time search
- Page creation/editing/deletion
- Automatic slug generation

### AI Assistant
- Vector similarity search
- OpenAI GPT-4 responses
- Source citations
- Feedback collection
- Chat history logging

### Technical Stack
- **Backend**: Flask + Supabase Python client
- **Database**: Supabase PostgreSQL with pgvector
- **AI**: OpenAI embeddings and chat completion
- **Frontend**: Bootstrap + Vanilla JavaScript
- **Deployment**: Vercel/Heroku/Railway ready
