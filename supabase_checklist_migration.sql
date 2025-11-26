-- Create checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_checklist_items_user_id ON checklist_items(user_id);

-- Create index on start_date for filtering
CREATE INDEX IF NOT EXISTS idx_checklist_items_start_date ON checklist_items(start_date);

-- Enable Row Level Security
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own checklist items
CREATE POLICY "Users can read their own checklist items"
  ON checklist_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own checklist items
CREATE POLICY "Users can insert their own checklist items"
  ON checklist_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own checklist items
CREATE POLICY "Users can update their own checklist items"
  ON checklist_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own checklist items
CREATE POLICY "Users can delete their own checklist items"
  ON checklist_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert dummy checklist items for all existing users
-- This will create sample items for each user in the system
DO $$
DECLARE
  user_record RECORD;
  today_date TIMESTAMPTZ;
  item_date TIMESTAMPTZ;
BEGIN
  today_date := CURRENT_DATE;
  
  -- Loop through all users
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Item 1: Today
    item_date := today_date + INTERVAL '9 hours';
    INSERT INTO checklist_items (user_id, title, description, start_date, end_date, completed)
    VALUES (
      user_record.id,
      'Annual physical exam',
      'Schedule your annual physical examination with your primary care physician',
      item_date,
      item_date + INTERVAL '1 hour',
      FALSE
    );
    
    -- Item 2: Today, 2 hours later
    item_date := today_date + INTERVAL '11 hours';
    INSERT INTO checklist_items (user_id, title, description, start_date, end_date, completed)
    VALUES (
      user_record.id,
      'Flu shot',
      'Get your annual flu vaccination',
      item_date,
      item_date + INTERVAL '30 minutes',
      FALSE
    );
    
    -- Item 3: Tomorrow
    item_date := today_date + INTERVAL '1 day' + INTERVAL '10 hours';
    INSERT INTO checklist_items (user_id, title, description, start_date, end_date, completed)
    VALUES (
      user_record.id,
      'Dental cleaning',
      'Regular dental checkup and cleaning',
      item_date,
      item_date + INTERVAL '1 hour',
      FALSE
    );
    
    -- Item 4: Day after tomorrow
    item_date := today_date + INTERVAL '2 days' + INTERVAL '14 hours';
    INSERT INTO checklist_items (user_id, title, description, start_date, end_date, completed)
    VALUES (
      user_record.id,
      'Eye exam',
      'Comprehensive eye examination',
      item_date,
      item_date + INTERVAL '1 hour',
      FALSE
    );
    
    -- Item 5: 3 days from now
    item_date := today_date + INTERVAL '3 days' + INTERVAL '9 hours';
    INSERT INTO checklist_items (user_id, title, description, start_date, end_date, completed)
    VALUES (
      user_record.id,
      'Lab work',
      'Blood work and lab tests as recommended by your doctor',
      item_date,
      item_date + INTERVAL '30 minutes',
      FALSE
    );
  END LOOP;
END $$;

-- Note: This script will also automatically create dummy items for any new users
-- You may want to create a trigger or function that runs on user creation
-- For now, the app will handle creating initial items when a user first accesses the checklist

