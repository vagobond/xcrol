
-- Create town_listings table for Xcrol Town (Craigslist-style classifieds)
CREATE TABLE public.town_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  category text NOT NULL,
  subcategory text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  price integer,
  location text,
  contact_method text DEFAULT 'message',
  contact_info text,
  has_images boolean DEFAULT false,
  image_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  flagged boolean DEFAULT false,
  expires_at timestamp with time zone DEFAULT (now() + interval '45 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.town_listings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active listings
CREATE POLICY "Anyone can view active listings"
  ON public.town_listings FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

-- Users can create their own listings
CREATE POLICY "Users can create listings"
  ON public.town_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
CREATE POLICY "Users can update own listings"
  ON public.town_listings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings"
  ON public.town_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for fast category browsing
CREATE INDEX idx_town_listings_category ON public.town_listings (category, subcategory);
CREATE INDEX idx_town_listings_user ON public.town_listings (user_id);
CREATE INDEX idx_town_listings_status ON public.town_listings (status, created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_town_listings_updated_at
  BEFORE UPDATE ON public.town_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
