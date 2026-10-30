import os
from PIL import Image, ImageDraw

os.makedirs('build', exist_ok=True)

# Create high-resolution 256x256 base icon
size = 256
img = Image.new('RGBA', (size, size), (11, 15, 23, 255))
draw = ImageDraw.Draw(img)

# Outer circle (moon disk)
draw.ellipse([20, 20, 236, 236], fill=(30, 41, 59, 255), outline=(2, 132, 199, 255), width=6)

# Glowing inner feature / crater
draw.ellipse([60, 60, 196, 196], fill=(15, 23, 42, 255), outline=(56, 189, 248, 255), width=4)

# Touchdown target reticle
draw.line([128, 40, 128, 90], fill=(16, 185, 129, 255), width=5)
draw.line([128, 166, 128, 216], fill=(16, 185, 129, 255), width=5)
draw.line([40, 128, 90, 128], fill=(16, 185, 129, 255), width=5)
draw.line([166, 128, 216, 128], fill=(16, 185, 129, 255), width=5)

# Center beacon
draw.ellipse([118, 118, 138, 138], fill=(16, 185, 129, 255), outline=(255, 255, 255, 255), width=2)

icon_path = os.path.join('build', 'icon.ico')
img.save(icon_path, format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
print(f"Generated {icon_path} successfully, size: {os.path.getsize(icon_path)} bytes")
