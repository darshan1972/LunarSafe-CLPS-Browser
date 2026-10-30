import sys
import os
import glob
import cv2
import json

def build_video(manifest_path, output_path, fps=10):
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    
    # 1920x1080 resolution
    width = 1920
    height = 1080
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    total_frames = 0
    for item in manifest:
        img_path = item['image']
        repeat = item.get('repeat', 1)
        if not os.path.exists(img_path):
            print(f"Warning: image {img_path} not found")
            continue
        img = cv2.imread(img_path)
        if img is None:
            continue
        if img.shape[1] != width or img.shape[0] != height:
            img = cv2.resize(img, (width, height))
        for _ in range(repeat):
            out.write(img)
            total_frames += 1
            
    out.release()
    duration = total_frames / fps
    print(f"Created {output_path}: {total_frames} frames, {duration:.1f}s at {fps} fps")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python make_video.py manifest.json output.mp4 [fps]")
        sys.exit(1)
    manifest = sys.argv[1]
    out_mp4 = sys.argv[2]
    fps = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    build_video(manifest, out_mp4, fps)
