import torch

# Load your trained model (best.pt)
model = torch.hub.load('ultralytics/yolov11m', 'custom', path='YOLOv11+keys/best.pt')  # replace with your local path



