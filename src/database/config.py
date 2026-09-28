import os
from pathlib import Path
from supabase import create_client, Client

def _get_supabase_credentials():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

    # If not in env, check .streamlit/secrets.toml
    if not url or not key:
        secrets_path = Path(__file__).resolve().parent.parent.parent / ".streamlit" / "secrets.toml"
        if secrets_path.exists():
            try:
                import tomllib
            except ImportError:
                import tomli as tomllib
            try:
                with open(secrets_path, "rb") as f:
                    secrets = tomllib.load(f)
                    url = url or secrets.get("SUPABASE_URL")
                    key = key or secrets.get("SUPABASE_KEY")
            except Exception:
                pass

    if not url or not key:
        # Fallback to streamlit secrets if running within streamlit
        try:
            import streamlit as st
            url = url or st.secrets.get("SUPABASE_URL")
            key = key or st.secrets.get("SUPABASE_KEY")
        except Exception:
            pass

    return url or "", key or ""

SUPABASE_URL, SUPABASE_KEY = _get_supabase_credentials()

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)