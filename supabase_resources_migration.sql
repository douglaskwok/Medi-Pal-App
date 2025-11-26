-- Create saved_resources table
CREATE TABLE IF NOT EXISTS saved_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  place_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_resources_user_id ON saved_resources(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_saved_resources_created_at ON saved_resources(created_at);

-- Enable Row Level Security
ALTER TABLE saved_resources ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own saved resources
CREATE POLICY "Users can read their own saved resources"
  ON saved_resources
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own saved resources
CREATE POLICY "Users can insert their own saved resources"
  ON saved_resources
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own saved resources
CREATE POLICY "Users can update their own saved resources"
  ON saved_resources
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own saved resources
CREATE POLICY "Users can delete their own saved resources"
  ON saved_resources
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_saved_resources_updated_at
  BEFORE UPDATE ON saved_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_resources_updated_at();

