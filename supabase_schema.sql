-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policy
DROP POLICY IF EXISTS "Avatar Upload Policy" ON storage.objects;
CREATE POLICY "Avatar Upload Policy" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar Read Policy" ON storage.objects;
CREATE POLICY "Avatar Read Policy" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');


-- Tables
CREATE TABLE IF NOT EXISTS profiles (
   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
   role TEXT NOT NULL CHECK (role IN ('farmer', 'consumer')),
   full_name TEXT NOT NULL DEFAULT '',
   avatar_url TEXT DEFAULT '',
   phone TEXT DEFAULT '',
   address TEXT DEFAULT '',
   city TEXT DEFAULT '',
   state_province TEXT DEFAULT '',
   latitude FLOAT8 DEFAULT NULL,
   longitude FLOAT8 DEFAULT NULL,
   delivery_status TEXT DEFAULT 'available' CHECK (delivery_status IN ('available', 'out', 'off')),
   delivery_note TEXT DEFAULT '',
   created_at TIMESTAMPTZ DEFAULT NOW(),
   updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   name TEXT NOT NULL,
   category TEXT NOT NULL DEFAULT 'Vegetable',
   unit TEXT NOT NULL DEFAULT 'kg',
   price NUMERIC NOT NULL DEFAULT 0,
   cost_price NUMERIC NOT NULL DEFAULT 0,
   stock INTEGER NOT NULL DEFAULT 0,
   emoji TEXT DEFAULT '🌱',
   created_at TIMESTAMPTZ DEFAULT NOW(),
   updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_requests (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
   created_at TIMESTAMPTZ DEFAULT NOW(),
   updated_at TIMESTAMPTZ DEFAULT NOW(),
   UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS conversations (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   user_one UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   user_two UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   chat_request_id UUID REFERENCES chat_requests(id),
   created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
   sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   content TEXT NOT NULL,
   created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   total_amount NUMERIC NOT NULL DEFAULT 0,
   status TEXT DEFAULT 'placed',
   created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
   product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
   quantity INTEGER NOT NULL DEFAULT 1,
   unit_price NUMERIC NOT NULL DEFAULT 0
);


-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- profiles
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
EXCEPTION WHEN OTHERS THEN END $$;

CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- products
DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone can read products" ON products;
    DROP POLICY IF EXISTS "Farmers can insert their own products" ON products;
    DROP POLICY IF EXISTS "Farmers can update their own products" ON products;
    DROP POLICY IF EXISTS "Farmers can delete their own products" ON products;
EXCEPTION WHEN OTHERS THEN END $$;

CREATE POLICY "Anyone can read products" ON products FOR SELECT USING (true);
CREATE POLICY "Farmers can insert their own products" ON products FOR INSERT WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "Farmers can update their own products" ON products FOR UPDATE USING (auth.uid() = farmer_id);
CREATE POLICY "Farmers can delete their own products" ON products FOR DELETE USING (auth.uid() = farmer_id);

-- chat_requests
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can read their requests" ON chat_requests;
    DROP POLICY IF EXISTS "Users can insert requests" ON chat_requests;
    DROP POLICY IF EXISTS "to_user can update status" ON chat_requests;
EXCEPTION WHEN OTHERS THEN END $$;

CREATE POLICY "Users can read their requests" ON chat_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can insert requests" ON chat_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "to_user can update status" ON chat_requests FOR UPDATE USING (auth.uid() = to_user_id);

-- conversations
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can read their conversations" ON conversations;
    DROP POLICY IF EXISTS "System can create conversations" ON conversations;
EXCEPTION WHEN OTHERS THEN END $$;

CREATE POLICY "Users can read their conversations" ON conversations FOR SELECT USING (auth.uid() = user_one OR auth.uid() = user_two);
CREATE POLICY "System can create conversations" ON conversations FOR INSERT WITH CHECK (true);

-- messages
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can read their messages" ON messages;
    DROP POLICY IF EXISTS "Users can insert their messages" ON messages;
EXCEPTION WHEN OTHERS THEN END $$;

CREATE POLICY "Users can read their messages" ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND (c.user_one = auth.uid() OR c.user_two = auth.uid())
    )
);
CREATE POLICY "Users can insert their messages" ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = conversation_id
        AND (c.user_one = auth.uid() OR c.user_two = auth.uid())
    )
);

-- orders
DO $$ BEGIN
    DROP POLICY IF EXISTS "Consumers can read their own orders" ON orders;
    DROP POLICY IF EXISTS "Consumers can insert orders" ON orders;
EXCEPTION WHEN OTHERS THEN END $$;

CREATE POLICY "Consumers can read their own orders" ON orders FOR SELECT USING (auth.uid() = consumer_id);
CREATE POLICY "Consumers can insert orders" ON orders FOR INSERT WITH CHECK (auth.uid() = consumer_id);

-- order_items
DO $$ BEGIN
    DROP POLICY IF EXISTS "Consumers can read their own order items" ON order_items;
    DROP POLICY IF EXISTS "Consumers can insert order items" ON order_items;
EXCEPTION WHEN OTHERS THEN END $$;

CREATE POLICY "Consumers can read their own order items" ON order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_items.order_id
        AND o.consumer_id = auth.uid()
    )
);
CREATE POLICY "Consumers can insert order items" ON order_items FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_id
        AND o.consumer_id = auth.uid()
    )
);


-- Triggers

-- handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'role', 'consumer'),
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- create_conversation_on_accept
CREATE OR REPLACE FUNCTION create_conversation_on_accept()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO public.conversations (user_one, user_two, chat_request_id)
        VALUES (NEW.from_user_id, NEW.to_user_id, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_chat_request_accepted ON chat_requests;
CREATE TRIGGER on_chat_request_accepted
    AFTER UPDATE ON chat_requests
    FOR EACH ROW EXECUTE PROCEDURE create_conversation_on_accept();
