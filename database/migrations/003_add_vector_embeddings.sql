-- Enable pgvector extension
create extension if not exists vector;

-- Create context table for vector embeddings
create table if not exists context (
  id bigserial primary key,
  content text not null,
  embedding vector(384), -- Dimension for sentence-transformers/all-MiniLM-L6-v2
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Search index
create index on context using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- RPC for match_context
create or replace function match_context (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    context.id,
    context.content,
    context.metadata,
    1 - (context.embedding <=> query_embedding) as similarity
  from context
  where 1 - (context.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
