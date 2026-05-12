# Import required libraries
import os
import zipfile
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from sklearn.model_selection import train_test_split

# Paths for training and testing datasets
train_images_path = r"C:\Users\kshit\Desktop\final_year_project\oil-spill\train\images"
train_masks_path  = r"C:\Users\kshit\Desktop\final_year_project\oil-spill\train\labels"
test_images_path  = r"C:\Users\kshit\Desktop\final_year_project\oil-spill\test\images"
test_masks_path   = r"C:\Users\kshit\Desktop\final_year_project\oil-spill\test\labels"

# Importing again (can be kept as it is)
import os
import numpy as np
from tensorflow.keras.preprocessing.image import load_img, img_to_array

# Defining image size for resizing all images and masks
IMG_HEIGHT = 256
IMG_WIDTH = 256

# Function to load images and corresponding masks
def load_data(img_dir, mask_dir):
    images, masks = [], []

    # Loop through all image files
    for img_name in os.listdir(img_dir):

        # Create image path
        img_path = os.path.join(img_dir, img_name)

        # Extract filename without extension
        stem = os.path.splitext(img_name)[0]

        # Match corresponding mask file using same filename
        mask_file = None
        for f in os.listdir(mask_dir):
            if os.path.splitext(f)[0] == stem:
                mask_file = f
                break

        # If no mask found, skip image
        if mask_file is None:
            print(f"Warning: mask not found for {img_name}")
            continue

        # Create mask path
        mask_path = os.path.join(mask_dir, mask_file)

        # Load and resize image
        img = load_img(img_path, target_size=(IMG_HEIGHT, IMG_WIDTH))

        # Convert image to numpy array and normalize pixel values
        img = img_to_array(img) / 255.0

        # Load and resize mask
        mask = load_img(mask_path, target_size=(IMG_HEIGHT, IMG_WIDTH))

        # Convert mask to numpy array and normalize
        mask = img_to_array(mask) / 255.0

        # Convert mask to single channel if mask has 3 channels
        if mask.shape[-1] == 3:
            mask = mask[..., 0]  # Take first channel only

        # Expand dimensions to make mask shape (256,256,1)
        mask = np.expand_dims(mask, axis=-1)

        # Convert mask into binary values (0 or 1)
        mask = (mask > 0.5).astype(np.float32)

        # Append processed image and mask
        images.append(img)
        masks.append(mask)

    # Convert lists into numpy arrays
    return np.array(images), np.array(masks)

# Load training dataset
X_train, y_train = load_data(train_images_path, train_masks_path)

# Load testing dataset
X_test, y_test = load_data(test_images_path, test_masks_path)

# Print training images array
print(X_train)

# Print training masks array
print(y_train)

# Split training data into training and validation sets
X_train, X_val, y_train, y_val = train_test_split(
    X_train,
    y_train,
    test_size=0.2,
    random_state=42
)

# Print shape of training data
print(X_train.shape)

# Function to create U-Net model architecture
def unet_model(input_size=(IMG_HEIGHT, IMG_WIDTH, 3)):

    # Input layer
    inputs = layers.Input(input_size)

    # Convolution block function
    def conv_block(x, filters):

        # First convolution layer
        x = layers.Conv2D(filters, 3, activation='relu', padding='same')(x)

        # Batch normalization for stable training
        x = layers.BatchNormalization()(x)

        # Second convolution layer
        x = layers.Conv2D(filters, 3, activation='relu', padding='same')(x)

        # Batch normalization
        x = layers.BatchNormalization()(x)

        # Dropout layer to reduce overfitting
        x = layers.Dropout(0.3)(x)

        return x

    # Encoder path (Downsampling)

    # First encoder block
    c1 = conv_block(inputs, 64)
    p1 = layers.MaxPooling2D((2, 2))(c1)

    # Second encoder block
    c2 = conv_block(p1, 128)
    p2 = layers.MaxPooling2D((2, 2))(c2)

    # Third encoder block
    c3 = conv_block(p2, 256)
    p3 = layers.MaxPooling2D((2, 2))(c3)

    # Fourth encoder block
    c4 = conv_block(p3, 512)
    p4 = layers.MaxPooling2D((2, 2))(c4)

    # Bottleneck layer
    c5 = conv_block(p4, 1024)

    # Decoder path (Upsampling)

    # First decoder block
    u6 = layers.Conv2DTranspose(
        512,
        (2, 2),
        strides=(2, 2),
        padding='same'
    )(c5)

    # Skip connection from encoder
    u6 = layers.concatenate([u6, c4])

    c6 = conv_block(u6, 512)

    # Second decoder block
    u7 = layers.Conv2DTranspose(
        256,
        (2, 2),
        strides=(2, 2),
        padding='same'
    )(c6)

    # Skip connection
    u7 = layers.concatenate([u7, c3])

    c7 = conv_block(u7, 256)

    # Third decoder block
    u8 = layers.Conv2DTranspose(
        128,
        (2, 2),
        strides=(2, 2),
        padding='same'
    )(c7)

    # Skip connection
    u8 = layers.concatenate([u8, c2])

    c8 = conv_block(u8, 128)

    # Fourth decoder block
    u9 = layers.Conv2DTranspose(
        64,
        (2, 2),
        strides=(2, 2),
        padding='same'
    )(c8)

    # Skip connection
    u9 = layers.concatenate([u9, c1])

    c9 = conv_block(u9, 64)

    # Output layer with sigmoid activation for binary segmentation
    outputs = layers.Conv2D(1, (1, 1), activation='sigmoid')(c9)

    # Create model
    model = models.Model(inputs=[inputs], outputs=[outputs])

    return model

# Build U-Net model
model = unet_model()

# Compile model using Adam optimizer and binary crossentropy loss
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# Import callbacks
import os
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

# Create folder to save trained model
os.makedirs("saved_model", exist_ok=True)

# Early stopping callback to stop training if validation loss doesn't improve
early_stop = EarlyStopping(
    monitor='val_loss',
    patience=5,
    restore_best_weights=True
)

# Save only the best model during training
checkpoint = ModelCheckpoint(
    "saved_model/best_model.h5",
    monitor='val_loss',
    save_best_only=True,
    verbose=1
)

# Train the model
history = model.fit(
    X_train,
    y_train,
    validation_data=(X_val, y_val),
    batch_size=8,
    epochs=30,
    callbacks=[early_stop, checkpoint],
    verbose=1
)

# Save final trained model
model.save("saved_model/oilspill_unet.h5")

# Print success message
print("✅ Model saved at saved_model/oilspill_unet.h5")
