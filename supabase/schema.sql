-- ==============================================================================
-- Supabase Schema for OpenScan AI: Conversational Image Recognition Chatbot
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Chest X-Ray Analysis',
    image_url TEXT NOT NULL,
    heatmap_url TEXT,
    organ TEXT DEFAULT 'lung',
    modality TEXT DEFAULT 'xray',
    task TEXT DEFAULT 'thoracic',
    detected_conditions JSONB DEFAULT '[]'::jsonb,
    confidence_scores JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast user query
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- 3. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast session messages retrieval
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Allow authenticated users and public demo access for hackathon)
-- Public read/write policy for hackathon demo (can be restricted to auth.uid() in production)
CREATE POLICY "Allow all actions for demo session" ON chat_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all actions for demo messages" ON chat_messages
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Storage Bucket Configuration (Run in Supabase Dashboard Storage UI or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('scan-images', 'scan-images', true)
-- ON CONFLICT (id) DO NOTHING;
