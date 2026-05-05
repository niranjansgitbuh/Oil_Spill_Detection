import os
import zipfile
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from sklearn.model_selection import train_test_split

train_images_path = r"C:\Users\kshit\Desktop\final_year_project\oil-spill\train\images"
train_masks_path  = r"C:\Users\kshit\Desktop\final_year_project\oil-spill\train\labels"
test_images_path  = r"C:\Users\kshit\Desktop\final_year_project\oil-spill\test\images"
test_masks_path   = r"C:\Users\kshit\Desktop\final_year_project\oil-spill\test\labels"

import os
import numpy as np
from tensorflow.keras.preprocessing.image import load_img, img_to_array

IMG_HEIGHT = 256
IMG_WIDTH = 256

def load_data(img_dir, mask_dir):
    images, masks = [], []
    for img_name in os.listdir(img_dir):
        img_path = os.path.join(img_dir, img_name)
        stem = os.path.splitext(img_name)[0]

        # Match mask file by stem
        mask_file = None
        for f in os.listdir(mask_dir):
            if os.path.splitext(f)[0] == stem:
                mask_file = f
                break
        if mask_file is None:
            print(f"Warning: mask not found for {img_name}")
            continue
        mask_path = os.path.join(mask_dir, mask_file)

        # Load image
        img = load_img(img_path, target_size=(IMG_HEIGHT, IMG_WIDTH))
        img = img_to_array(img) / 255.0

        # Load mask
        mask = load_img(mask_path, target_size=(IMG_HEIGHT, IMG_WIDTH))
        mask = img_to_array(mask) / 255.0

        # Convert mask to single channel (binary)
        if mask.shape[-1] == 3:
            mask = mask[..., 0]  # take first channel
        mask = np.expand_dims(mask, axis=-1)
        mask = (mask > 0.5).astype(np.float32)  # binarize

        images.append(img)
        masks.append(mask)
    return np.array(images), np.array(masks)


X_train, y_train = load_data(train_images_path, train_masks_path)
X_test, y_test = load_data(test_images_path, test_masks_path)

print(X_train)

print(y_train)

X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.2, random_state=42)
print(X_train.shape)


def unet_model(input_size=(IMG_HEIGHT, IMG_WIDTH, 3)):
    inputs = layers.Input(input_size)

    def conv_block(x, filters):
        x = layers.Conv2D(filters, 3, activation='relu', padding='same')(x)
        x = layers.BatchNormalization()(x)  # ✅ ADD BatchNorm
        x = layers.Conv2D(filters, 3, activation='relu', padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.3)(x)  # ✅ ADD Dropout to prevent overfitting
        return x

    c1 = conv_block(inputs, 64)
    p1 = layers.MaxPooling2D((2, 2))(c1)

    c2 = conv_block(p1, 128)
    p2 = layers.MaxPooling2D((2, 2))(c2)

    c3 = conv_block(p2, 256)
    p3 = layers.MaxPooling2D((2, 2))(c3)

    c4 = conv_block(p3, 512)
    p4 = layers.MaxPooling2D((2, 2))(c4)

    c5 = conv_block(p4, 1024)

    u6 = layers.Conv2DTranspose(512, (2, 2), strides=(2, 2), padding='same')(c5)
    u6 = layers.concatenate([u6, c4])
    c6 = conv_block(u6, 512)

    u7 = layers.Conv2DTranspose(256, (2, 2), strides=(2, 2), padding='same')(c6)
    u7 = layers.concatenate([u7, c3])
    c7 = conv_block(u7, 256)

    u8 = layers.Conv2DTranspose(128, (2, 2), strides=(2, 2), padding='same')(c7)
    u8 = layers.concatenate([u8, c2])
    c8 = conv_block(u8, 128)

    u9 = layers.Conv2DTranspose(64, (2, 2), strides=(2, 2), padding='same')(c8)
    u9 = layers.concatenate([u9, c1])
    c9 = conv_block(u9, 64)

    outputs = layers.Conv2D(1, (1, 1), activation='sigmoid')(c9)

    model = models.Model(inputs=[inputs], outputs=[outputs])
    return model


model = unet_model()
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

import os
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
os.makedirs("saved_model", exist_ok=True)

early_stop = EarlyStopping(
    monitor='val_loss',
    patience=5,
    restore_best_weights=True
)

checkpoint = ModelCheckpoint(
    "saved_model/best_model.h5",
    monitor='val_loss',
    save_best_only=True,
    verbose=1
)

history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    batch_size=8,
    epochs=30,
    callbacks=[early_stop, checkpoint],
    verbose=1
)

model.save("saved_model/oilspill_unet.h5")
print("✅ Model saved at saved_model/oilspill_unet.h5")


