import os
from PIL import Image, ImageOps

def create_pwa_icons():
    logo_path = "frontend/public/lahana-logo.png"
    icons_dir = "frontend/public/icons"
    os.makedirs(icons_dir, exist_ok=True)

    if not os.path.exists(logo_path):
        print(f"Error: {logo_path} does not exist!")
        return

    # Load original logo
    img = Image.open(logo_path)
    
    # Lahana green color for background: #2D5016 (RGB: 45, 80, 22)
    green_color = (45, 80, 22)

    # 1. Generate icon-512.png (512x512)
    # Resize the image keeping aspect ratio, then paste onto a square green background
    size_512 = 512
    background_512 = Image.new("RGBA", (size_512, size_512), green_color + (255,))
    
    # We want the logo to take up about 75% of the icon width/height
    max_logo_size = int(size_512 * 0.75)
    img_ratio = img.width / img.height
    if img_ratio > 1:
        new_width = max_logo_size
        new_height = int(max_logo_size / img_ratio)
    else:
        new_height = max_logo_size
        new_width = int(max_logo_size * img_ratio)
        
    logo_resized_512 = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Paste centered
    offset_x = (size_512 - new_width) // 2
    offset_y = (size_512 - new_height) // 2
    
    # If the original logo has transparency, use it as alpha mask
    if logo_resized_512.mode in ('RGBA', 'LA') or (logo_resized_512.mode == 'P' and 'transparency' in logo_resized_512.info):
        background_512.paste(logo_resized_512, (offset_x, offset_y), logo_resized_512)
    else:
        background_512.paste(logo_resized_512, (offset_x, offset_y))
        
    background_512.save(os.path.join(icons_dir, "icon-512.png"), "PNG")
    print("Saved icon-512.png")

    # 2. Generate icon-192.png (192x192)
    icon_192 = background_512.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save(os.path.join(icons_dir, "icon-192.png"), "PNG")
    print("Saved icon-192.png")

    # 3. Generate icon-512-maskable.png (512x512 with safe zone inset - 60% logo size)
    background_maskable = Image.new("RGBA", (size_512, size_512), green_color + (255,))
    maskable_logo_size = int(size_512 * 0.60) # Smaller to ensure it fits in maskable circle safe zone
    if img_ratio > 1:
        new_width_m = maskable_logo_size
        new_height_m = int(maskable_logo_size / img_ratio)
    else:
        new_height_m = maskable_logo_size
        new_width_m = int(maskable_logo_size * img_ratio)
        
    logo_resized_m = img.resize((new_width_m, new_height_m), Image.Resampling.LANCZOS)
    offset_x_m = (size_512 - new_width_m) // 2
    offset_y_m = (size_512 - new_height_m) // 2
    
    if logo_resized_m.mode in ('RGBA', 'LA') or (logo_resized_m.mode == 'P' and 'transparency' in logo_resized_m.info):
        background_maskable.paste(logo_resized_m, (offset_x_m, offset_y_m), logo_resized_m)
    else:
        background_maskable.paste(logo_resized_m, (offset_x_m, offset_y_m))
        
    background_maskable.save(os.path.join(icons_dir, "icon-512-maskable.png"), "PNG")
    print("Saved icon-512-maskable.png")

    # 4. Generate shortcut icons (96x96)
    for name in ["pos-icon", "frontdesk-icon", "housekeeping-icon"]:
        icon_shortcut = background_512.resize((96, 96), Image.Resampling.LANCZOS)
        icon_shortcut.save(os.path.join(icons_dir, f"{name}.png"), "PNG")
        print(f"Saved {name}.png")

if __name__ == "__main__":
    create_pwa_icons()
