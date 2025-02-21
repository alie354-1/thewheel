-- Drop existing company_documents table
DROP TABLE IF EXISTS company_documents CASCADE;

-- Create company_documents table with proper references
CREATE TABLE company_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL,
  size_bytes bigint,
  folder_path text DEFAULT '/',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  last_modified_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view company documents"
  ON company_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE id = company_documents.company_id
      AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM company_members
          WHERE company_id = companies.id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create company documents"
  ON company_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE id = company_documents.company_id
      AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM company_members
          WHERE company_id = companies.id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update company documents"
  ON company_documents
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE id = company_documents.company_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete company documents"
  ON company_documents
  FOR DELETE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE id = company_documents.company_id
      AND owner_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_company_documents_company_id ON company_documents(company_id);
CREATE INDEX idx_company_documents_created_by ON company_documents(created_by);
CREATE INDEX idx_company_documents_folder_path ON company_documents(folder_path);