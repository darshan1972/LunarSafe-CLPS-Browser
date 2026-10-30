---
metrics:
- precision
- recall
- mean_iou
library_name: yolov5
pipeline_tag: object-detection
tags:
- astronomy
- space
- yolo
- yolov5
- moon
- crater/boulder detection
- OHRC
- ISRO
- Chandrayaan 2
---
# YOLOv5 for Crater/Boulder detection on Moon

A yolov5s and a yolov5l model was trained on a labelled dataset of marked craters/boulders on moon. This was trained for the 3rd problem statement *Automatic detection of craters & boulders from Orbiter High Resolution Camera(OHRC) images using AI/ML techniques* of **Bharatiya Antariksh Hackathon 2024**. Only the finetuned yolov5l is present in this repo.

## Sample Outputs

<div align="center">
  <img width="640" alt="Gurveer05/moon-crater-boulder-detection-yolov5" src="https://huggingface.co/Gurveer05/moon-crater-boulder-detection-yolov5/resolve/main/sample_outputs.jpg">
</div>

## How to use

- Install [yolov5](https://github.com/fcakyon/yolov5-pip):

```bash
pip install -U yolov5
```

- Load model and perform prediction:

```python
import yolov5
# from PIL import Image

# load model
model = yolov5.load('Gurveer05/moon-crater-boulder-detection-yolov5')
  
# set model parameters
model.conf = 0.25  # NMS confidence threshold
model.iou = 0.45  # NMS IoU threshold
model.agnostic = False  # NMS class-agnostic
model.multi_label = False  # NMS multiple labels per box
model.max_det = 1000  # maximum number of detections per image

# set image
img = 'path/to/image' # or use: img = Image.open('/path/to/image')

# perform inference
results = model(img) # add size=640 if needed

# inference with test time augmentation
results = model(img, augment=True)

# parse results
predictions = results.pred[0]
boxes = predictions[:, :4] # x1, y1, x2, y2
scores = predictions[:, 4]
categories = predictions[:, 5]

# show detection bounding boxes on image
results.show()

# save results into "results/" folder
results.save(save_dir='results/')
```

- Finetune the model on your custom dataset:

```bash
yolov5 train --data data.yaml --img 640 --batch 16 --weights Gurveer05/moon-crater-boulder-detection-yolov5 --epochs 10
```

## Miscellaneous

- [Sample Working](https://drive.google.com/file/d/1e5Rz6eTlZUaikBiUzhhjcTTXLNCqk_-i/view?usp=sharing)
- [Dataset](https://www.kaggle.com/datasets/gurveersinghvirk/crater-boulder-moon-yolo-format)
- [Code for training](https://www.kaggle.com/code/gurveersinghvirk/isro-hackathon?scriptVersionId=189827639)
- [Output for OHRC images](https://www.kaggle.com/datasets/florabert/ohrc-moon-crater-boulder-detections-yolov5)
- [Sliced OHRC images input](https://www.kaggle.com/datasets/gurveersinghvirk/ohrc-sliced)
- [Code for inference on sliced OHRC images (Marked Images and Bounding Boxes CSV outputs)](https://www.kaggle.com/code/florabert/isro-hackathon-copy-1?scriptVersionId=189900697)
- [Code for inference on sliced OHRC images (lat/long .shp files for bounding boxes and center)](https://www.kaggle.com/code/florabert/isro-hackathon-copy-1?scriptVersionId=189903524)