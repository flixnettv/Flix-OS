-- Enable Row Level Security
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_tools ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Allow service role access" ON agent_logs
  FOR ALL TO service_role
  USING (true);

CREATE POLICY "Allow service role access" ON agent_memories
  FOR ALL TO service_role
  USING (true);

CREATE POLICY "Allow service role access" ON agent_tasks
  FOR ALL TO service_role
  USING (true);

CREATE POLICY "Allow service role access" ON agent_tools
  FOR ALL TO service_role
  USING (true);

CREATE POLICY "Allow service role access" ON mcp_tools
  FOR ALL TO service_role
  USING (true);

-- Create sample agent
INSERT INTO agents (id, name, model, role_prompt, is_active, created_at, updated_at)
VALUES (
  'default-agent',
  'Default Assistant',
  'gemini/gemini-pro',
  'You are a helpful AI assistant. Respond concisely and accurately.',
  true,
  NOW(),
  NOW()
);