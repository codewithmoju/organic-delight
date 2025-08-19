/*
  # Update policies for full access

  1. Changes
    - Remove admin-only restrictions
    - Allow all authenticated users to perform CRUD operations
    - Maintain basic security by requiring authentication

  2. Security
    - All operations still require authentication
    - Row level security remains enabled
    - Users can only access data while authenticated
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can modify categories" ON categories;
DROP POLICY IF EXISTS "Only admins can modify items" ON items;

-- Create new permissive policies for categories
CREATE POLICY "Authenticated users can modify categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new permissive policies for items
CREATE POLICY "Authenticated users can modify items"
  ON items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new permissive policies for transactions
CREATE POLICY "Authenticated users can modify transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);