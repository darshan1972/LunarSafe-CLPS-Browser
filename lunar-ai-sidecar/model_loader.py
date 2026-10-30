"""
LunarSafe YOLO Model Loader (Legacy YOLOv5)
Team Rocket · AEROX Club · Parul University
Project Head: Darshan Patil

Loads the YOLOv5 moon crater/boulder detection model using torch.hub 
(ultralytics/yolov5). The modern 'ultralytics' package does NOT support 
YOLOv5 checkpoints, so we use torch.hub-based loading.

IMPORTANT: This is an EXTERNAL BENCHMARK service. Its output is NOT 
part of the deterministic hash chain. It exists for comparison only.
"""

from pathlib import Path


MODEL_PATH = Path(__file__).parent / "models" / "yolov5-moon" / "best.pt"

_model_cache = None


def load_model():
    """Load the YOLOv5 moon crater detection model via torch.hub."""
    global _model_cache
    if _model_cache is not None:
        return _model_cache
    
    if not MODEL_PATH.exists():
        print(f"Model not found at {MODEL_PATH}. Downloading from Hugging Face...")
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        import urllib.request
        hf_url = "https://huggingface.co/Gurveer05/moon-crater-boulder-detection-yolov5/resolve/main/best.pt"
        try:
            urllib.request.urlretrieve(hf_url, str(MODEL_PATH))
            print("Model weights successfully downloaded from Hugging Face.")
        except Exception as dl_err:
            raise FileNotFoundError(
                f"Model weights not found at {MODEL_PATH} and auto-download failed: {dl_err}. "
                "Download best.pt manually from https://huggingface.co/Gurveer05/moon-crater-boulder-detection-yolov5"
            )
    
    import pathlib
    pathlib.PosixPath = pathlib.WindowsPath
    import torch
    
    # Load YOLOv5 via torch.hub. This uses the official ultralytics/yolov5 
    # repository, which supports legacy YOLOv5 checkpoints.
    model = torch.hub.load(
        "ultralytics/yolov5",
        "custom",
        path=str(MODEL_PATH),
        force_reload=False,
        trust_repo=True,
    )
    model.eval()
    _model_cache = model
    return model


def detect_hazards(image_path, conf_threshold=0.25):
    """
    Run YOLOv5 inference on a lunar image.

    Returns:
        dict with 'craters' and 'boulders' lists
    """
    model = load_model()
    model.conf = conf_threshold
    
    results = model(image_path)
    df = results.pandas().xyxy[0]
    
    craters = []
    boulders = []
    
    for _, row in df.iterrows():
        cls_name = str(row["name"]).lower()
        detection = {
            "x1": float(row["xmin"]),
            "y1": float(row["ymin"]),
            "x2": float(row["xmax"]),
            "y2": float(row["ymax"]),
            "confidence": float(row["confidence"]),
            "class_name": cls_name,
        }
        if "crater" in cls_name:
            craters.append(detection)
        elif "boulder" in cls_name or "rock" in cls_name:
            boulders.append(detection)
    
    return {
        "craters": craters,
        "boulders": boulders,
        "crater_count": len(craters),
        "boulder_count": len(boulders),
    }


if __name__ == "__main__":
    print(f"Loading model from {MODEL_PATH}...")
    model = load_model()
    print(f"Model loaded: {type(model).__name__}")
    print(f"Classes: {model.names}")
