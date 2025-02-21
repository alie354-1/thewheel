-- Drop existing functions and triggers first
DO $$ BEGIN
    DROP FUNCTION IF EXISTS calculate_company_burn_rate(uuid, int) CASCADE;
    DROP FUNCTION IF EXISTS track_document_version() CASCADE;
    DROP FUNCTION IF EXISTS schedule_contract_events() CASCADE;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS company_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size bigint,
  folder_path text DEFAULT '/',
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  last_modified_by uuid REFERENCES auth.users(id),
  version int DEFAULT 1,
  is_archived boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES company_documents(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  file_url text NOT NULL,
  changes_description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  contract_type text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  file_url text,
  counterparty text,
  start_date date,
  end_date date,
  value numeric,
  currency text DEFAULT 'USD',
  renewal_terms text,
  notice_period interval,
  key_terms text[],
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  last_modified_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_contract_dates CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS contract_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES company_contracts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date date NOT NULL,
  description text,
  notification_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intellectual_property (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  ip_type text NOT NULL,
  status text NOT NULL,
  filing_date date,
  grant_date date,
  expiration_date date,
  jurisdiction text,
  application_number text,
  registration_number text,
  description text,
  inventors text[],
  documents jsonb DEFAULT '[]',
  maintenance_fees jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  asset_type text NOT NULL,
  status text NOT NULL,
  purchase_date date,
  purchase_price numeric,
  current_value numeric,
  location text,
  assigned_to uuid REFERENCES auth.users(id),
  warranty_info jsonb DEFAULT '{}',
  maintenance_history jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  date date NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  category text NOT NULL,
  description text,
  vendor text,
  receipt_url text,
  payment_method text,
  reimbursable boolean DEFAULT false,
  reimbursed boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  date date NOT NULL,
  metric_type text NOT NULL,
  value numeric NOT NULL,
  unit text,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
DO $$ BEGIN
    ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE company_contracts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE contract_events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE intellectual_property ENABLE ROW LEVEL SECURITY;
    ALTER TABLE company_assets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE company_expenses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE company_metrics ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Drop existing policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "company_members_can_view_documents" ON company_documents;
    DROP POLICY IF EXISTS "company_members_can_create_documents" ON company_documents;
    DROP POLICY IF EXISTS "document_owners_and_admins_can_update" ON company_documents;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Create policies
CREATE POLICY "company_members_can_view_documents"
  ON company_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_id = company_documents.company_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "company_members_can_create_documents"
  ON company_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_id = company_documents.company_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "document_owners_and_admins_can_update"
  ON company_documents FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_id = company_documents.company_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Create indexes
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_company_documents_company ON company_documents(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_documents_created_by ON company_documents(created_by);
    CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);
    CREATE INDEX IF NOT EXISTS idx_company_contracts_company ON company_contracts(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_contracts_status ON company_contracts(status);
    CREATE INDEX IF NOT EXISTS idx_contract_events_contract ON contract_events(contract_id);
    CREATE INDEX IF NOT EXISTS idx_intellectual_property_company ON intellectual_property(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_assets_company ON company_assets(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_expenses_company ON company_expenses(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_expenses_date ON company_expenses(date);
    CREATE INDEX IF NOT EXISTS idx_company_metrics_company ON company_metrics(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_metrics_date ON company_metrics(date);
    CREATE INDEX IF NOT EXISTS idx_company_metrics_type ON company_metrics(metric_type);
EXCEPTION
    WHEN others THEN null;
END $$;

-- Create functions
CREATE OR REPLACE FUNCTION calculate_company_burn_rate(company_id uuid, months int DEFAULT 3)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  burn_rate numeric;
BEGIN
  SELECT COALESCE(AVG(amount), 0)
  INTO burn_rate
  FROM company_expenses
  WHERE company_expenses.company_id = calculate_company_burn_rate.company_id
  AND date >= (CURRENT_DATE - (months || ' months')::interval);
  
  RETURN burn_rate;
END;
$$;

CREATE OR REPLACE FUNCTION track_document_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.file_url != OLD.file_url OR NEW.version != OLD.version) THEN
    INSERT INTO document_versions (
      document_id,
      version_number,
      file_url,
      changes_description,
      created_by
    ) VALUES (
      NEW.id,
      NEW.version,
      NEW.file_url,
      'Version ' || NEW.version,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION schedule_contract_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Schedule renewal notice
  IF NEW.notice_period IS NOT NULL AND NEW.end_date IS NOT NULL THEN
    INSERT INTO contract_events (
      contract_id,
      event_type,
      event_date,
      description
    ) VALUES (
      NEW.id,
      'renewal_notice',
      NEW.end_date - NEW.notice_period,
      'Contract renewal notice period begins'
    );
  END IF;

  -- Schedule expiration notice
  IF NEW.end_date IS NOT NULL THEN
    INSERT INTO contract_events (
      contract_id,
      event_type,
      event_date,
      description
    ) VALUES (
      NEW.id,
      'expiration',
      NEW.end_date,
      'Contract expires'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS track_document_version ON company_documents;
CREATE TRIGGER track_document_version
  AFTER UPDATE ON company_documents
  FOR EACH ROW
  EXECUTE FUNCTION track_document_version();

DROP TRIGGER IF EXISTS schedule_contract_events ON company_contracts;
CREATE TRIGGER schedule_contract_events
  AFTER INSERT ON company_contracts
  FOR EACH ROW
  EXECUTE FUNCTION schedule_contract_events();