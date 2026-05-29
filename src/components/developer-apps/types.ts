export interface OAuthApp {
  id: string;
  name: string;
  description: string | null;
  client_id: string;
  redirect_uris: string[];
  logo_url: string | null;
  homepage_url: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface OAuthAppFormState {
  name: string;
  description: string;
  homepage_url: string;
  redirect_uris: string;
  logo_url: string;
}

export const emptyForm: OAuthAppFormState = {
  name: "",
  description: "",
  homepage_url: "",
  redirect_uris: "",
  logo_url: "",
};
