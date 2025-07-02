from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from supabase import create_client, Client
from datetime import datetime
import os
import openai
import uuid
import re
from typing import List, Dict, Any
from dotenv import load_dotenv
import logging # Keep logging for debugging
import collections

load_dotenv()
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Configure logging
logging.basicConfig(level=logging.INFO, # Set to INFO to see general flow, DEBUG for more detail
                    format='%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s')
logger = logging.getLogger(__name__) # Use a logger instance

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Set OpenAI API key
openai.api_key = os.getenv('OPENAI_API_KEY')

# Helper Functions
def create_slug(title: str) -> str:
    """Create a URL-friendly slug from title"""
    logger.info(f"Creating slug for title: '{title}'")
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    logger.info(f"Generated slug: '{slug}'")
    return slug.strip('-')

# REMOVED: html_to_plain_text function (no longer needed for Markdown)

def split_into_chunks(text: str, max_chunk_size: int = 500) -> List[str]:
    """Split text into chunks for embedding"""
    logger.info(f"Splitting text into chunks (size: {max_chunk_size}). Text length: {len(text)}")
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

    logger.info(f"Generated {len(chunks)} chunks.")
    return [chunk for chunk in chunks if chunk]

def generate_embeddings(page_id: str, content: str): # Content is now expected to be Markdown
    """Generate embeddings for page content (Markdown)."""
    logger.info(f"Attempting to generate embeddings for page_id: {page_id}")
    if not content.strip():
        logger.info(f"Content is empty for page_id: {page_id}. Skipping embedding generation.")
        return

    try:
        # Delete existing chunks for this page
        logger.info(f"Deleting existing chunks for page_id: {page_id}")
        supabase.table('wiki_chunks').delete().eq('page_id', page_id).execute()
        logger.info(f"Existing chunks deleted for page_id: {page_id}")

        # Split Markdown content directly into chunks
        chunks = split_into_chunks(content)

        for i, chunk in enumerate(chunks):
            if not chunk.strip():
                logger.warning(f"Empty chunk {i} found for page_id: {page_id}. Skipping.")
                continue

            # Generate embedding
            logger.info(f"Generating embedding for chunk {i} of page_id: {page_id} (length: {len(chunk)})")
            response = openai.embeddings.create(
                model="text-embedding-3-small",
                input=chunk
            )

            embedding = response.data[0].embedding
            logger.info(f"Embedding generated for chunk {i}.")

            # Save chunk with embedding
            chunk_data = {
                'page_id': page_id,
                'content_chunk': chunk,
                'embedding': embedding,
                'token_count': len(chunk.split())
            }

            supabase.table('wiki_chunks').insert(chunk_data).execute()
            logger.info(f"Chunk {i} saved for page_id: {page_id}.")

    except Exception as e:
        logger.error(f"Error generating embeddings for page_id: {page_id}. Error: {e}", exc_info=True)

def search_similar_chunks(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Search for similar chunks using vector similarity"""
    logger.info(f"Searching for similar chunks for query: '{query}' (limit: {limit})")
    try:
        # Generate embedding for query
        logger.info("Generating embedding for query...")
        response = openai.embeddings.create(
            model="text-embedding-3-small",
            input=query
        )
        query_embedding = response.data[0].embedding
        logger.info("Query embedding generated.")

        # Search for similar chunks using Supabase RPC function
        logger.info(f"Calling Supabase RPC 'search_wiki_chunks' with threshold 0.7 and count {limit}")
        result = supabase.rpc('search_wiki_chunks', {
            'query_embedding': query_embedding,
            'match_threshold': 0.7,
            'match_count': limit
        }).execute()

        if result.data:
            logger.info(f"Found {len(result.data)} similar chunks.")
        else:
            logger.info("No similar chunks found.")
        return result.data if result.data else []

    except Exception as e:
        logger.error(f"Error searching chunks for query: '{query}'. Error: {e}", exc_info=True)
        return []

def search_pages_content(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Search for pages by content using text search"""
    logger.info(f"Searching pages by content for query: '{query}' (limit: {limit})")
    try:
        # Use PostgreSQL full-text search
        result = supabase.table('wiki_pages').select('id, title, slug, content').text_search('content', query).limit(limit).execute()
        logger.info(f"Full-text search returned {len(result.data)} results.")

        search_results = []
        for page in result.data:
            # Create snippet with highlighted search term from Markdown content
            content = page['content'] # Content is Markdown here
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

        logger.info(f"Returning {len(search_results)} processed search results.")
        return search_results

    except Exception as e:
        logger.error(f"Error searching pages by content for query: '{query}'. Error: {e}", exc_info=True)
        return []

def get_all_pages() -> List[Dict[str, Any]]:
    """Get all wiki pages"""
    logger.info("Fetching all wiki pages.")
    try:
        result = supabase.table('wiki_pages').select('*').order('sort_order').execute()
        logger.info(f"Fetched {len(result.data)} wiki pages.")
        return result.data if result.data else []
    except Exception as e:
        logger.error(f"Error fetching all pages: {e}", exc_info=True)
        return []

def get_page_by_slug(slug: str) -> Dict[str, Any] | None:
    """Get a wiki page by slug"""
    logger.info(f"Fetching page by slug: '{slug}'")
    try:
        result = supabase.table('wiki_pages').select('*').eq('slug', slug).single().execute()
        if result.data:
            logger.info(f"Page found by slug: '{slug}'")
        else:
            logger.info(f"Page not found by slug: '{slug}'")
        return result.data if result.data else None
    except Exception as e:
        logger.error(f"Error fetching page by slug: '{slug}'. Error: {e}", exc_info=True)
        return None

def get_page_by_id(page_id: str) -> Dict[str, Any] | None:
    """Get a wiki page by ID"""
    logger.info(f"Fetching page by ID: '{page_id}'")
    try:
        result = supabase.table('wiki_pages').select('*').eq('id', page_id).single().execute()
        if result.data:
            logger.info(f"Page found by ID: '{page_id}'")
        else:
            logger.info(f"Page not found by ID: '{page_id}'")
        return result.data if result.data else None
    except Exception as e:
        logger.error(f"Error fetching page by ID: '{page_id}'. Error: {e}", exc_info=True)
        return None

def initialize_default_pages(): # Content is now Markdown again
    """Create default pages if none exist"""
    logger.info("Checking if default pages need to be initialized.")
    try:
        result = supabase.table('wiki_pages').select('id').limit(1).execute()

        if result.data and len(result.data) > 0:
            logger.info("Pages already exist. Skipping default page initialization.")
            return

        logger.info("No pages found. Initializing default pages...")
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
            logger.info(f"Inserting default page: '{page_data['title']}'")
            supabase.table('wiki_pages').insert(page_data).execute()
            logger.info(f"Default page '{page_data['title']}' inserted.")

            if page_data['content']:
                generate_embeddings(page_data['id'], page_data['content'])

        logger.info("Default pages created successfully!")

    except Exception as e:
        logger.error(f"Error creating default pages: {e}", exc_info=True)

def build_page_tree(pages: List[Dict]) -> List[Dict]:
    """Builds a hierarchical tree from a flat list of pages."""
    page_map = {page['id']: page for page in pages}
    for page in pages:
        page['children'] = []

    root_pages = []
    for page in pages:
        if page['parent_id']:
            parent = page_map.get(page['parent_id'])
            if parent:
                parent['children'].append(page)
        else:
            root_pages.append(page)

    # Sort children by sort_order if available, or by title
    for page in pages:
        page['children'].sort(key=lambda x: x.get('sort_order', x['title']))

    root_pages.sort(key=lambda x: x.get('sort_order', x['title']))

    return root_pages

# Routes
@app.route('/')
def index():
    logger.info("Accessed index page.")
    pages = get_all_pages()

    if not pages:
        initialize_default_pages()
        pages = get_all_pages() # Re-fetch after initialization

    # Build hierarchical tree
    page_tree = build_page_tree(pages)

    home_page = next((p for p in pages if p['slug'] == 'home'), pages[0] if pages else None)
    logger.info(f"Serving index page with current_page: {home_page['slug'] if home_page else 'None'}")
    return render_template('index.html', pages=page_tree, current_page=home_page)

@app.route('/wiki/<slug>')
def wiki_page(slug):
    logger.info(f"Accessed wiki page with slug: '{slug}'")
    pages = get_all_pages()
    current_page = get_page_by_slug(slug)

    if not current_page:
        logger.warning(f"Page not found for slug: '{slug}'. Redirecting to index.")
        flash('Page not found', 'error')
        return redirect(url_for('index'))

    # Build hierarchical tree
    page_tree = build_page_tree(pages)

    logger.info(f"Serving wiki page: '{current_page['title']}'")
    return render_template('index.html', pages=page_tree, current_page=current_page)

@app.route('/create', methods=['GET', 'POST'])
def create_page():
    if request.method == 'POST':
        logger.info("Received POST request to create a page.")
        title = request.form.get('title')
        content = request.form.get('content', '') # Content is Markdown
        parent_id = request.form.get('parent_id') or None

        if not title:
            logger.warning("Attempted to create page with no title. Redirecting.")
            flash('Title is required', 'error')
            return redirect(url_for('create_page'))

        slug = create_slug(title)

        existing = get_page_by_slug(slug)
        if existing:
            original_slug = slug
            slug = f"{slug}-{uuid.uuid4().hex[:8]}"
            logger.info(f"Slug '{original_slug}' already exists. Generated new unique slug: '{slug}'")

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
            logger.info(f"Inserting new page: '{title}' with slug: '{slug}'")
            result = supabase.table('wiki_pages').insert(page_data).execute()
            logger.info(f"Page '{title}' inserted successfully.")

            if content:
                generate_embeddings(page_data['id'], content)

            flash('Page created successfully!', 'success')
            return redirect(url_for('wiki_page', slug=slug))

        except Exception as e:
            logger.error(f"Error creating page '{title}': {e}", exc_info=True)
            flash(f'Error creating page: {str(e)}', 'error')
            return redirect(url_for('create_page'))

    logger.info("Serving GET request for create page form.")
    pages = get_all_pages()
    return render_template('create_page.html', pages=pages)

@app.route('/edit/<slug>', methods=['GET', 'POST'])
def edit_page(slug):
    logger.info(f"Accessed edit page for slug: '{slug}'")
    page = get_page_by_slug(slug)

    if not page:
        logger.warning(f"Page not found for editing with slug: '{slug}'. Redirecting.")
        flash('Page not found', 'error')
        return redirect(url_for('index'))

    if request.method == 'POST':
        logger.info(f"Received POST request to update page '{slug}'.")
        title = request.form.get('title')
        content = request.form.get('content', '') # Content is Markdown

        try:
            update_data = {
                'title': title,
                'content': content,
                'updated_at': datetime.utcnow().isoformat()
            }
            logger.info(f"Updating page '{page['title']}' (ID: {page['id']}) with new title: '{title}'.")
            supabase.table('wiki_pages').update(update_data).eq('id', page['id']).execute()
            logger.info(f"Page '{page['title']}' updated successfully.")

            if content:
                generate_embeddings(page['id'], content)

            flash('Page updated successfully!', 'success')
            return redirect(url_for('wiki_page', slug=slug))

        except Exception as e:
            logger.error(f"Error updating page '{page['title']}' (ID: {page['id']}): {e}", exc_info=True)
            flash(f'Error updating page: {str(e)}', 'error')

    logger.info(f"Serving GET request for edit page '{page['title']}'.")
    pages = get_all_pages()
    return render_template('edit_page.html', page=page, pages=pages)

@app.route('/delete/<slug>', methods=['POST'])
def delete_page(slug):
    logger.info(f"Received POST request to delete page with slug: '{slug}'")
    page = get_page_by_slug(slug)

    if not page:
        logger.warning(f"Page not found for deletion with slug: '{slug}'. Redirecting.")
        flash('Page not found', 'error')
        return redirect(url_for('index'))

    try:
        logger.info(f"Deleting page '{page['title']}' (ID: {page['id']}).")
        supabase.table('wiki_pages').delete().eq('id', page['id']).execute()
        logger.info(f"Page '{page['title']}' deleted successfully.")
        flash('Page deleted successfully!', 'success')

    except Exception as e:
        logger.error(f"Error deleting page '{page['title']}' (ID: {page['id']}): {e}", exc_info=True)
        flash(f'Error deleting page: {str(e)}', 'error')

    return redirect(url_for('index'))

# API Routes
@app.route('/api/update/<slug>', methods=['PUT'])
def update_page_inline(slug):
    """Update a page via inline editing"""
    logger.info(f"Received PUT request for inline update of slug: {slug}")

    try:
        page = get_page_by_slug(slug)

        if not page:
            logger.warning(f"Page not found for inline update with slug: {slug}.")
            return jsonify({'error': 'Page not found'}), 404

        data = request.get_json()
        if not data:
            logger.warning("No JSON data received for inline update.")
            return jsonify({'error': 'No data provided'}), 400

        title = data.get('title', '').strip()
        content = data.get('content', '') # Content is Markdown

        logger.info(f"Updating page '{slug}' with title: '{title}' and content length: {len(content)}.")

        if not title:
            logger.warning(f"Title is empty for inline update of slug: {slug}.")
            return jsonify({'error': 'Title is required'}), 400

        update_data = {
            'title': title,
            'content': content,
            'updated_at': datetime.utcnow().isoformat()
        }

        result = supabase.table('wiki_pages').update(update_data).eq('id', page['id']).execute()
        logger.info(f"Database update result for slug '{slug}': {result}")

        if content != page.get('content', ''):
            try:
                logger.info(f"Content changed for slug '{slug}'. Regenerating embeddings.")
                generate_embeddings(page['id'], content)
                logger.info(f"Embeddings regenerated successfully for slug '{slug}'.")
            except Exception as e:
                logger.error(f"Error regenerating embeddings for slug '{slug}': {e}", exc_info=True)
                # Don't fail the update if embeddings fail

        return jsonify({
            'success': True,
            'message': 'Page updated successfully',
            'updated_at': update_data['updated_at']
        })

    except Exception as e:
        logger.error(f"Error updating page inline for slug '{slug}': {e}", exc_info=True)
        return jsonify({'error': f'Failed to update page: {str(e)}'}), 500

@app.route('/api/page-by-slug/<slug>')
def get_page_by_slug_api(slug):
    """Get page data by slug for API calls"""
    logger.info(f"API: Fetching page data by slug: '{slug}'")
    page = get_page_by_slug(slug)
    if not page:
        logger.warning(f"API: Page not found by slug: '{slug}'. Returning 404.")
        return jsonify({'error': 'Page not found'}), 404
    logger.info(f"API: Returning page data for slug: '{slug}'")
    return jsonify(page)

@app.route('/api/chat', methods=['POST'])
def chat():
    logger.info("API: Received POST request for chat.")
    data = request.get_json()
    question = data.get('message', '')

    if not question:
        logger.warning("API: No question provided for chat. Returning 400.")
        return jsonify({'error': 'No question provided'}), 400

    logger.info(f"API: Chat question received: '{question}'")
    try:
        # Search for relevant chunks
        relevant_chunks = search_similar_chunks(question, 5)
        logger.info(f"API: Found {len(relevant_chunks)} relevant chunks for chat question.")

        # Build context
        context = "\n\n".join([
            f"From '{chunk['page_title']}': {chunk['content_chunk']}"
            for chunk in relevant_chunks
        ])
        logger.debug(f"API: Context built for LLM:\n{context}") # Use debug level for detailed context

        # Define system_prompt HERE, after context is built
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

        # Generate response using OpenAI
        logger.info("API: Calling OpenAI chat completions.")
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
        logger.info(f"API: OpenAI response received. Answer length: {len(answer)}")

        # Log the chat
        chat_data = {
            'id': str(uuid.uuid4()),
            'question': question,
            'response': answer,
            'context_chunks': [chunk['id'] for chunk in relevant_chunks],
            'created_at': datetime.utcnow().isoformat()
        }
        logger.info(f"API: Logging chat data to Supabase for question: '{question}'")
        supabase.table('chat_logs').insert(chat_data).execute()
        logger.info("API: Chat data logged successfully.")

        return jsonify({
            'response': answer,
            'sources': list(set([chunk['page_title'] for chunk in relevant_chunks]))
        })

    except Exception as e:
        logger.error(f"API: Chat error for question '{question}': {e}", exc_info=True)
        return jsonify({'error': 'Failed to generate response'}), 500

@app.route('/api/feedback', methods=['POST'])
def feedback():
    logger.info("API: Received POST request for feedback.")
    data = request.get_json()
    chat_id = data.get('chat_id')
    is_helpful = data.get('helpful')

    try:
        if chat_id:
            logger.info(f"API: Updating feedback for chat_id: '{chat_id}' to helpful: {is_helpful}")
            supabase.table('chat_logs').update({'feedback': is_helpful}).eq('id', chat_id).execute()
            logger.info("API: Feedback updated successfully.")

        return jsonify({'success': True})

    except Exception as e:
        logger.error(f"API: Error saving feedback for chat_id '{chat_id}': {e}", exc_info=True)
        return jsonify({'error': 'Failed to save feedback'}), 500

@app.route('/api/wiki', methods=['GET', 'POST'])
def wiki_api():
    if request.method == 'GET':
        logger.info("API: Received GET request for wiki pages.")
        try:
            pages = get_all_pages()
            logger.info(f"API: Returning {len(pages)} wiki pages.")
            return jsonify(pages)
        except Exception as e:
            logger.error(f"API: Error fetching wiki pages: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 500

    elif request.method == 'POST':
        logger.info("API: Received POST request to create wiki page via API.")
        try:
            data = request.get_json()
            title = data.get('title')
            content = data.get('content', '') # Content is Markdown
            parent_id = data.get('parent_id')

            if not title:
                logger.warning("API: Title missing for API page creation. Returning 400.")
                return jsonify({'error': 'Title is required'}), 400

            slug = create_slug(title)

            existing = get_page_by_slug(slug)
            if existing:
                original_slug = slug
                slug = f"{slug}-{uuid.uuid4().hex[:8]}"
                logger.info(f"API: Slug '{original_slug}' exists. Generated new slug: '{slug}'")

            page_data = {
                'id': str(uuid.uuid4()),
                'title': title,
                'slug': slug,
                'content': content,
                'parent_id': parent_id,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }

            logger.info(f"API: Inserting new wiki page: '{title}' via API.")
            result = supabase.table('wiki_pages').insert(page_data).execute()
            logger.info(f"API: Wiki page '{title}' inserted via API successfully.")

            if content:
                generate_embeddings(page_data['id'], content)

            return jsonify(page_data)

        except Exception as e:
            logger.error(f"API: Error creating wiki page via API: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 500

@app.route('/api/search')
def search_api():
    """Global search API endpoint"""
    logger.info("API: Received GET request for global search.")
    query = request.args.get('q', '').strip()

    if len(query) < 2:
        logger.info("API: Search query too short. Returning empty results.")
        return jsonify([])

    logger.info(f"API: Global search query: '{query}'")
    try:
        results = search_pages_content(query, 10)
        logger.info(f"API: Global search returned {len(results)} results.")
        return jsonify(results)
    except Exception as e:
        logger.error(f"API: Global search error for query '{query}': {e}", exc_info=True)
        return jsonify([])

@app.route('/health')
def health_check():
    """Health check endpoint to verify Supabase connection"""
    logger.info("Accessed health check endpoint.")
    try:
        logger.info("Attempting to query wiki_pages table for health check.")
        result = supabase.table('wiki_pages').select('id').limit(1).execute()
        pages_count = len(get_all_pages()) # This will also log its own info
        logger.info("Health check successful. Supabase connected.")
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'pages_count': pages_count
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Starting Flask application...")
    app.run(debug=True, host='0.0.0.0', port=5000)