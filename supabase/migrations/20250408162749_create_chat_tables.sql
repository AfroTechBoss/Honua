-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
    chat_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participants UUID[] NOT NULL,
    last_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    message_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES public.chats(chat_id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chats_participants ON public.chats USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chats table
CREATE POLICY "Users can view their own chats"
    ON public.chats FOR SELECT
    USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can create chats"
    ON public.chats FOR INSERT
    WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY "Users can update their own chats"
    ON public.chats FOR UPDATE
    USING (auth.uid() = ANY(participants));

-- Create policies for messages table
CREATE POLICY "Users can view messages in their chats"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chats
            WHERE chat_id = messages.chat_id
            AND auth.uid() = ANY(participants)
        )
    );

CREATE POLICY "Users can send messages to their chats"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.chats
            WHERE chat_id = messages.chat_id
            AND auth.uid() = ANY(participants)
        )
    );

CREATE POLICY "Users can update message read status in their chats"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.chats
            WHERE chat_id = messages.chat_id
            AND auth.uid() = ANY(participants)
        )
    );