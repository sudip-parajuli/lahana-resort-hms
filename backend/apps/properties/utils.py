import base64
from django.conf import settings
from apps.properties.models import Property

def get_logo_base64():
    """
    Retrieves the property logo (either uploaded via Property model or from static fallback)
    and encodes it as a base64 Data URI to prevent network resolution issues in PDF rendering.
    """
    try:
        prop = Property.objects.first()
        if prop and prop.logo:
            from django.core.files.storage import default_storage
            with default_storage.open(prop.logo.name, 'rb') as f:
                encoded = base64.b64encode(f.read()).decode('utf-8')
                return f"data:image/png;base64,{encoded}"
    except Exception:
        pass

    # Fallback to local static logo
    try:
        logo_path = settings.BASE_DIR / "static" / "lahana-logo.png"
        if logo_path.exists():
            with open(logo_path, "rb") as f:
                encoded = base64.b64encode(f.read()).decode("utf-8")
                return f"data:image/png;base64,{encoded}"
    except Exception:
        pass

    return ""
