-- Create scraper_contracts table
create table if not exists scraper_contracts (
  id bigserial primary key,
  name text,
  source_code text not null, -- Stores the whole code
  explanation text,          -- Stores the full AI explanation
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Search index for source_code or name
create index on scraper_contracts (name);
