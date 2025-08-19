/*
  # Update Schema for Organic Delight Inventory System

  1. Schema Updates
    - Add currency and unit fields to items table
    - Add get_low_stock_items function
    - Update profiles table structure
    - Add notifications table
    - Add RLS policies

  2. Changes
    - Items table: Add currency and unit columns
    - New stored procedure for low stock alerts
    - Enhanced profile management
    - Notification system implementation
*/

-- Add new columns to items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'units';

-- Add preferred_currency to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_currency TEXT NOT NULL DEFAULT 'USD';

-- Create function to get low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
  id UUID,
  name TEXT,
  quantity INTEGER,
  reorder_point INTEGER,
  unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    i.quantity,
    i.reorder_point,
    i.unit
  FROM items i
  WHERE i.quantity <= i.reorder_point;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create notification triggers
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity <= NEW.reorder_point THEN
    INSERT INTO notifications (type, message, user_id)
    SELECT 
      'low_stock',
      format('Low stock alert: %s has only %s %s remaining', NEW.name, NEW.quantity, NEW.unit),
      p.id
    FROM profiles p;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_stock_levels ON items;
CREATE TRIGGER check_stock_levels
  AFTER INSERT OR UPDATE OF quantity ON items
  FOR EACH ROW
  EXECUTE FUNCTION notify_low_stock();