#!/usr/bin/env python3
"""
Supabase setup script for AtlasAI
This script helps you set up the required tables and functions in Supabase
"""

from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def setup_supabase():
    """Setup Supabase tables and functions"""
    
    # Get Supabase credentials
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Use service role key for admin operations
    
    if not supabase_url or not supabase_key:
        print("Error: Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file")
        return
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        print("Setting up Supabase for AtlasAI...")
        
        # Test connection
        result = supabase.table('wiki_pages').select('id').limit(1).execute()
        print("✅ Successfully connected to Supabase!")
        
        # Check if tables exist by trying to query them
        try:
            supabase.table('wiki_pages').select('id').limit(1).execute()
            print("✅ Tables already exist and are accessible!")
        except Exception as e:
            print("❌ Tables don't exist or aren't accessible.")
            print("Please run the SQL setup script in your Supabase dashboard:")
            print("\n" + "="*50)
            print(get_sql_setup_script())
            print("="*50 + "\n")
            return
        
        print("🎉 Supabase setup completed successfully!")
        print("You can now run the Flask application with: python app.py")
        
    except Exception as e:
        print(f"❌ Error setting up Supabase: {e}")
        print("Please check your Supabase credentials and try again.")

def get_sql_setup_script():
    """Return the SQL script to set up tables and functions"""
    return """
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create wiki_pages table
CREATE TABLE IF NOT EXISTS wiki_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT DEFAULT '',
  parent_id UUID REFERENCES wiki_pages(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'admin'
);

-- Create wiki_chunks table for vector embeddings
CREATE TABLE IF NOT EXISTS wiki_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES wiki_pages(id) ON DELETE CASCADE,
  content_chunk TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  token_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_logs table
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  context_chunks UUID[],
  response TEXT,
  feedback BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wiki_pages_parent_id ON wiki_pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_slug ON wiki_pages(slug);
CREATE INDEX IF NOT EXISTS idx_wiki_chunks_page_id ON wiki_chunks(page_id);
CREATE INDEX IF NOT EXISTS idx_wiki_chunks_embedding ON wiki_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to search similar wiki chunks
CREATE OR REPLACE FUNCTION search_wiki_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  page_id UUID,
  content_chunk TEXT,
  similarity FLOAT,
  page_title TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wc.id,
    wc.page_id,
    wc.content_chunk,
    1 - (wc.embedding <=> query_embedding) AS similarity,
    wp.title AS page_title
  FROM wiki_chunks wc
  JOIN wiki_pages wp ON wc.page_id = wp.id
  WHERE 1 - (wc.embedding <=> query_embedding) > match_threshold
  ORDER BY wc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE wiki_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on wiki_pages" ON wiki_pages FOR ALL USING (true);
CREATE POLICY "Allow all operations on wiki_chunks" ON wiki_chunks FOR ALL USING (true);
CREATE POLICY "Allow all operations on chat_logs" ON chat_logs FOR ALL USING (true);
"""

if __name__ == "__main__":
    setup_supabase()
