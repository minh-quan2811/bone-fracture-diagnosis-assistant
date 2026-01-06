from rfdetr import RFDETRSmall
from .constant_path import ModelPath

class DeepLearningModelManager:
    def __init__(self):
        pass

    def get_detr_model(self):
        model = RFDETRSmall(pretrain_weights=str(ModelPath.RFDETR_MODEL_PATH))
        model.optimize_for_inference()
        return model

dl_model_manager = DeepLearningModelManager()

print(ModelPath.RFDETR_MODEL_PATH)