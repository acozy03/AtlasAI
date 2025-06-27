from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from supabase import create_client, Client
from datetime import datetime
import os
import openai
import uuid
import re
from typing import List, Dict, Any

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Set OpenAI API key
openai.api_key = os.getenv('OPENAI_API_KEY')

# Helper Functions
def create_slug(title: str) -> str:
    """Create a URL-friendly slug from title"""
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def split_into_chunks(text: str, max_chunk_size: int = 500) -> List[str]:
    """Split text into chunks for embedding"""
    sentences = re.split(r'[.!?]+', text)
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) > max_chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = sentence
        else:
            current_chunk += sentence + ". "
    
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return [chunk for chunk in chunks if chunk]

def generate_embeddings(page_id: str, content: str):
    """Generate embeddings for page content"""
    if not content.strip():
        return
    
    try:
        # Delete existing chunks for this page
        supabase.table('wiki_chunks').delete().eq('page_id', page_id).execute()
        
        # Split content into chunks
        chunks = split_into_chunks(content)
        
        for chunk in chunks:
            if not chunk.strip():
                continue
                
            # Generate embedding
            response = openai.embeddings.create(
                model="text-embedding-3-small",
                input=chunk
            )
            
            embedding = response.data[0].embedding
            
            # Save chunk with embedding
            chunk_data = {
                'page_id': page_id,
                'content_chunk': chunk,
                'embedding': embedding,
                'token_count': len(chunk.split())
            }
            
            supabase.table('wiki_chunks').insert(chunk_data).execute()
            
    except Exception as e:
        print(f"Error generating embeddings: {e}")

def search_similar_chunks(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Search for similar chunks using vector similarity"""
    try:
        # Generate embedding for query
        response = openai.embeddings.create(
            model="text-embedding-3-small",
            input=query
        )
        query_embedding = response.data[0].embedding
        
        # Search for similar chunks using Supabase RPC function
        result = supabase.rpc('search_wiki_chunks', {
            'query_embedding': query_embedding,
            'match_threshold': 0.7,
            'match_count': limit
        }).execute()
        
        return result.data if result.data else []
        
    except Exception as e:
        print(f"Error searching chunks: {e}")
        return []

def search_pages_content(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Search for pages by content using text search"""
    try:
        # Use PostgreSQL full-text search
        result = supabase.table('wiki_pages').select('id, title, slug, content').text_search('content', query).limit(limit).execute()
        
        search_results = []
        for page in result.data:
            # Create snippet with highlighted search term
            content = page['content']
            query_lower = query.lower()
            content_lower = content.lower()
            
            # Find the position of the query in content
            pos = content_lower.find(query_lower)
            if pos != -1:
                # Extract snippet around the match
                start = max(0, pos - 50)
                end = min(len(content), pos + len(query) + 50)
                snippet = content[start:end]
                
                # Add ellipsis if needed
                if start > 0:
                    snippet = "..." + snippet
                if end < len(content):
                    snippet = snippet + "..."
                    
                # Highlight the search term (simple approach)
                snippet = snippet.replace(query, f"<mark>{query}</mark>")
            else:
                # Fallback to first 100 characters
                snippet = content[:100] + "..." if len(content) > 100 else content
            
            search_results.append({
                'id': page['id'],
                'title': page['title'],
                'slug': page['slug'],
                'snippet': snippet
            })
        
        return search_results
        
    except Exception as e:
        print(f"Error searching pages: {e}")
        return []

def get_all_pages() -> List[Dict[str, Any]]:
    """Get all wiki pages"""
    try:
        result = supabase.table('wiki_pages').select('*').order('sort_order').execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Error fetching pages: {e}")
        return []

def get_page_by_slug(slug: str) -> Dict[str, Any] | None:
    """Get a wiki page by slug"""
    try:
        result = supabase.table('wiki_pages').select('*').eq('slug', slug).single().execute()
        return result.data if result.data else None
    except Exception as e:
        print(f"Error fetching page by slug: {e}")
        return None

def get_page_by_id(page_id: str) -> Dict[str, Any] | None:
    """Get a wiki page by ID"""
    try:
        result = supabase.table('wiki_pages').select('*').eq('id', page_id).single().execute()
        return result.data if result.data else None
    except Exception as e:
        print(f"Error fetching page by ID: {e}")
        return None

def initialize_default_pages():
    """Create default pages if none exist"""
    try:
        # Check if any pages exist
        result = supabase.table('wiki_pages').select('id').limit(1).execute()
        
        if result.data and len(result.data) > 0:
            return  # Pages already exist
        
        # Create default pages
        default_pages = [
            {
                'id': str(uuid.uuid4()),
                'title': "Home",
                'slug': "home",
                'content': """# Welcome to AtlasAI

This is your internal knowledge management system. Use this wiki to document processes, procedures, and important information for your team.

## Getting Started

- Create new pages using the + button in the sidebar
- Organize pages in a hierarchy by setting parent pages
- Use the AI assistant to ask questions about your content
- Edit pages by clicking on them

## Features

- **Hierarchical Organization**: Organize your content in a tree structure
- **AI-Powered Search**: Ask questions and get intelligent answers
- **Rich Content**: Support for Markdown formatting
- **Global Search**: Search across all pages from the navigation bar""",
                'sort_order': 0,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            },
            {
                'id': str(uuid.uuid4()),
                'title': "Getting Started",
                'slug': "getting-started",
                'content': """# Getting Started with AtlasAI

## Creating Your First Page

1. Click the + button in the sidebar
2. Enter a title for your page
3. Optionally select a parent page to organize it
4. Add initial content in Markdown format
5. Click "Create Page"

## Using the Rich Editor

- Click on any page content to start editing
- Use the toolbar for formatting options
- Add links to other pages or external URLs
- Save automatically when you click outside

## Using the AI Assistant

The AI assistant can help you:
- Find information across all your wiki pages
- Answer questions based on your content
- Suggest related topics to document

## Best Practices

- Use clear, descriptive titles
- Organize related content under parent pages
- Keep content up to date
- Use the global search to find information quickly""",
                'sort_order': 1,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
        ]
        
        for page_data in default_pages:
            # Insert page
            supabase.table('wiki_pages').insert(page_data).execute()
            
            # Generate embeddings
            generate_embeddings(page_data['id'], page_data['content'])
            
        print("Default pages created successfully!")
        
    except Exception as e:
        print(f"Error creating default pages: {e}")

# Routes
@app.route('/')
def index():
    pages = get_all_pages()
    
    # Initialize default pages if none exist
    if not pages:
        initialize_default_pages()
        pages = get_all_pages()
    
    home_page = next((p for p in pages if p['slug'] == 'home'), pages[0] if pages else None)
    
    return render_template('index.html', pages=pages, current_page=home_page)

@app.route('/wiki/<slug>')
def wiki_page(slug):
    pages = get_all_pages()
    current_page = get_page_by_slug(slug)
    
    if not current_page:
        flash('Page not found', 'error')
        return redirect(url_for('index'))
    
    return render_template('index.html', pages=pages, current_page=current_page)

@app.route('/create', methods=['GET', 'POST'])
def create_page():
    if request.method == 'POST':
        title = request.form.get('title')
        content = request.form.get('content', '')
        parent_id = request.form.get('parent_id') or None
        
        if not title:
            flash('Title is required', 'error')
            return redirect(url_for('create_page'))
        
        slug = create_slug(title)
        
        # Check if slug already exists
        existing = get_page_by_slug(slug)
        if existing:
            slug = f"{slug}-{uuid.uuid4().hex[:8]}"
        
        page_data = {
            'id': str(uuid.uuid4()),
            'title': title,
            'slug': slug,
            'content': content,
            'parent_id': parent_id,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        try:
            # Insert page
            result = supabase.table('wiki_pages').insert(page_data).execute()
            
            # Generate embeddings
            if content:
                generate_embeddings(page_data['id'], content)
            
            flash('Page created successfully!', 'success')
            return redirect(url_for('wiki_page', slug=slug))
            
        except Exception as e:
            flash(f'Error creating page: {str(e)}', 'error')
            return redirect(url_for('create_page'))
    
    pages = get_all_pages()
    return render_template('create_page.html', pages=pages)

@app.route('/edit/<slug>', methods=['GET', 'POST'])
def edit_page(slug):
    page = get_page_by_slug(slug)
    
    if not page:
        flash('Page not found', 'error')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        title = request.form.get('title')
        content = request.form.get('content', '')
        
        try:
            # Update page
            update_data = {
                'title': title,
                'content': content,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            supabase.table('wiki_pages').update(update_data).eq('id', page['id']).execute()
            
            # Regenerate embeddings
            if content:
                generate_embeddings(page['id'], content)
            
            flash('Page updated successfully!', 'success')
            return redirect(url_for('wiki_page', slug=slug))
            
        except Exception as e:
            flash(f'Error updating page: {str(e)}', 'error')
    
    pages = get_all_pages()
    return render_template('edit_page.html', page=page, pages=pages)

@app.route('/delete/<slug>', methods=['POST'])
def delete_page(slug):
    page = get_page_by_slug(slug)
    
    if not page:
        flash('Page not found', 'error')
        return redirect(url_for('index'))
    
    try:
        # Delete page (chunks will be deleted automatically due to foreign key constraint)
        supabase.table('wiki_pages').delete().eq('id', page['id']).execute()
        
        flash('Page deleted successfully!', 'success')
        
    except Exception as e:
        flash(f'Error deleting page: {str(e)}', 'error')
    
    return redirect(url_for('index'))

# API Routes
@app.route('/api/update/<slug>', methods=['PUT'])
def update_page_inline(slug):
    """Update a page via inline editing"""
    print(f"Received PUT request for slug: {slug}")  # Debug log
    
    try:
        # Get the page by slug
        page = get_page_by_slug(slug)
        
        if not page:
            print(f"Page not found for slug: {slug}")  # Debug log
            return jsonify({'error': 'Page not found'}), 404
        
        # Get the JSON data from request
        data = request.get_json()
        if not data:
            print("No JSON data received")  # Debug log
            return jsonify({'error': 'No data provided'}), 400
        
        title = data.get('title', '').strip()
        content = data.get('content', '')
        
        print(f"Updating page with title: '{title}' and content length: {len(content)}")  # Debug log
        
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        
        # Update page in database
        update_data = {
            'title': title,
            'content': content,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase.table('wiki_pages').update(update_data).eq('id', page['id']).execute()
        print(f"Database update result: {result}")  # Debug log
        
        # Regenerate embeddings if content changed
        if content != page.get('content', ''):
            try:
                generate_embeddings(page['id'], content)
                print("Embeddings regenerated successfully")  # Debug log
            except Exception as e:
                print(f"Error regenerating embeddings: {e}")  # Debug log
                # Don't fail the update if embeddings fail
        
        return jsonify({
            'success': True,
            'message': 'Page updated successfully',
            'updated_at': update_data['updated_at']
        })
        
    except Exception as e:
        print(f"Error updating page: {e}")  # Debug log
        return jsonify({'error': f'Failed to update page: {str(e)}'}), 500

@app.route('/api/page-by-slug/<slug>')
def get_page_by_slug_api(slug):
    """Get page data by slug for API calls"""
    page = get_page_by_slug(slug)
    if not page:
        return jsonify({'error': 'Page not found'}), 404
    return jsonify(page)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    question = data.get('message', '')
    
    if not question:
        return jsonify({'error': 'No question provided'}), 400
    
    try:
        # Search for relevant chunks
        relevant_chunks = search_similar_chunks(question, 5)
        
        # Build context
        context = "\n\n".join([
            f"From '{chunk['page_title']}': {chunk['content_chunk']}"
            for chunk in relevant_chunks
        ])
        
        # Generate response using OpenAI
        system_prompt = f"""You are AtlasAI, an intelligent assistant for our internal wiki system. 
Your role is to help users find information from our knowledge base and answer questions based on the wiki content.

Context from relevant wiki pages:
{context}

Guidelines:
- Answer questions based primarily on the provided context
- If the context doesn't contain enough information, say so clearly
- Always cite which wiki pages your information comes from
- Be concise but thorough
- If asked about something not in the wiki, suggest creating a new wiki page for it"""

        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        answer = response.choices[0].message.content
        
        # Log the chat
        chat_data = {
            'id': str(uuid.uuid4()),
            'question': question,
            'response': answer,
            'context_chunks': [chunk['id'] for chunk in relevant_chunks],
            'created_at': datetime.utcnow().isoformat()
        }
        
        supabase.table('chat_logs').insert(chat_data).execute()
        
        return jsonify({
            'response': answer,
            'sources': list(set([chunk['page_title'] for chunk in relevant_chunks]))
        })
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': 'Failed to generate response'}), 500

@app.route('/api/feedback', methods=['POST'])
def feedback():
    data = request.get_json()
    chat_id = data.get('chat_id')
    is_helpful = data.get('helpful')
    
    try:
        # Update chat log with feedback
        if chat_id:
            supabase.table('chat_logs').update({'feedback': is_helpful}).eq('id', chat_id).execute()
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"Feedback error: {e}")
        return jsonify({'error': 'Failed to save feedback'}), 500

@app.route('/api/wiki', methods=['GET', 'POST'])
def wiki_api():
    if request.method == 'GET':
        try:
            pages = get_all_pages()
            return jsonify(pages)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            title = data.get('title')
            content = data.get('content', '')
            parent_id = data.get('parent_id')
            
            if not title:
                return jsonify({'error': 'Title is required'}), 400
            
            slug = create_slug(title)
            
            # Check if slug already exists
            existing = get_page_by_slug(slug)
            if existing:
                slug = f"{slug}-{uuid.uuid4().hex[:8]}"
            
            page_data = {
                'id': str(uuid.uuid4()),
                'title': title,
                'slug': slug,
                'content': content,
                'parent_id': parent_id,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Insert page
            result = supabase.table('wiki_pages').insert(page_data).execute()
            
            # Generate embeddings
            if content:
                generate_embeddings(page_data['id'], content)
            
            return jsonify(page_data)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/search')
def search_api():
    """Global search API endpoint"""
    query = request.args.get('q', '').strip()
    
    if len(query) < 2:
        return jsonify([])
    
    try:
        results = search_pages_content(query, 10)
        return jsonify(results)
    except Exception as e:
        print(f"Search API error: {e}")
        return jsonify([])

@app.route('/health')
def health_check():
    """Health check endpoint to verify Supabase connection"""
    try:
        # Try to query the wiki_pages table
        result = supabase.table('wiki_pages').select('id').limit(1).execute()
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'pages_count': len(get_all_pages())
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)