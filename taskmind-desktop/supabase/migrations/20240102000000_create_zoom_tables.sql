-- Create zoom_tokens table for storing OAuth tokens
CREATE TABLE zoom_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create meetings table to store Zoom meeting information
CREATE TABLE meetings (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  topic TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  duration INTEGER,
  recording_url TEXT,
  transcript_url TEXT,
  status TEXT CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for zoom_tokens
ALTER TABLE zoom_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own Zoom tokens
CREATE POLICY "Users can manage their own Zoom tokens" ON zoom_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Enable Row Level Security for meetings
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own meetings
CREATE POLICY "Users can manage their own meetings" ON meetings
  FOR ALL USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp for meetings
CREATE OR REPLACE FUNCTION update_meetings_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meetings_modtime
BEFORE UPDATE ON meetings
FOR EACH ROW
EXECUTE FUNCTION update_meetings_modtime();

-- Create indexes for performance
CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_start_time ON meetings(start_time);
CREATE INDEX idx_meetings_status ON meetings(status); 