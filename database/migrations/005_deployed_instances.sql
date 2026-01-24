CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create deployed_instances table to track live contracts
CREATE TABLE IF NOT EXISTS deployed_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id TEXT REFERENCES contracts(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    artifact_json JSONB NOT NULL,
    constructor_args JSONB DEFAULT '[]',
    network TEXT DEFAULT 'chipnet',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deployed_instances ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own deployments" 
ON deployed_instances FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own deployments" 
ON deployed_instances FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own deployments" 
ON deployed_instances FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own deployments" 
ON deployed_instances FOR DELETE 
USING (auth.uid() = owner_id);

-- allow public read if linked to a public contract
CREATE POLICY "Anyone can view deployments of public contracts"
ON deployed_instances FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM contracts 
        WHERE contracts.id = deployed_instances.project_id 
        AND contracts.is_public = true
    )
);
