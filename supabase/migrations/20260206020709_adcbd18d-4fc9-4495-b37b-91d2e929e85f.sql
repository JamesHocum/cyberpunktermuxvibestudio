-- Create extensions table for community extension system
CREATE TABLE public.extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  author TEXT,
  is_approved BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;

-- Public read access for approved extensions
CREATE POLICY "Anyone can view approved extensions"
ON public.extensions
FOR SELECT
USING (is_approved = true);

-- Authenticated users can submit extensions
CREATE POLICY "Authenticated users can submit extensions"
ON public.extensions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can manage all extensions
CREATE POLICY "Admins can manage extensions"
ON public.extensions
FOR ALL
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_extensions_updated_at
BEFORE UPDATE ON public.extensions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();