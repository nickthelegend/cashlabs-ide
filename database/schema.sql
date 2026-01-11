-- Create a table for users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create a table for smart contracts
CREATE TABLE public.contracts (
  id TEXT NOT NULL PRIMARY KEY, -- We'll use the contract Hash ID here
  owner_id UUID REFERENCES public.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_code TEXT, -- The .cash file content
  artifact_json JSONB, -- The compiled artifact
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view public contracts
CREATE POLICY "Anyone can view public contracts" ON public.contracts
  FOR SELECT USING (is_public = true);

-- Allow authenticated users to view their own private contracts
CREATE POLICY "Users can view own contracts" ON public.contracts
  FOR SELECT USING (auth.uid() = owner_id);

-- Allow users to insert their own contracts
CREATE POLICY "Users can create contracts" ON public.contracts
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Allow users to update their own contracts
CREATE POLICY "Users can update own contracts" ON public.contracts
  FOR UPDATE USING (auth.uid() = owner_id);

-- Create a table for deployments (history)
CREATE TABLE public.deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id TEXT REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  deployer_id UUID REFERENCES public.users(id),
  tx_id TEXT NOT NULL,
  address TEXT NOT NULL,
  network TEXT DEFAULT 'chipnet',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for deployments
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view deployments of public contracts
CREATE POLICY "Anyone can view deployments of public contracts" ON public.deployments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE public.contracts.id = public.deployments.contract_id
      AND public.contracts.is_public = true
    )
  );

-- Allow users to view their own deployments
CREATE POLICY "Users can view own deployments" ON public.deployments
  FOR SELECT USING (auth.uid() = deployer_id);

-- Allow users to insert deployments
CREATE POLICY "Users can insert deployments" ON public.deployments
  FOR INSERT WITH CHECK (auth.uid() = deployer_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
