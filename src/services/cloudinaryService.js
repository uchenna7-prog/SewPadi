// src/services/cloudinaryService.js
// ─────────────────────────────────────────────────────────────
// Cloudinary upload utility.
// Compresses images client-side before uploading to save
// bandwidth and Cloudinary quota, without distorting images.
// ─────────────────────────────────────────────────────────────

const CLOUD_NAME  = 'dzqrelgbd'
const UPLOAD_PRESET = 'SewPadiUploads'
const UPLOAD_URL  = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

// ── Compression config ────────────────────────────────────────
const MAX_DIMENSION = 1200   // px — longest side, aspect ratio preserved
const QUALITY       = 0.82   // 82% — visually identical, ~60% smaller

/**
 * Compresses an image File/Blob before upload.
 * Maintains aspect ratio — never stretches or crops.
 * Returns a Blob.
 */
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Only downscale — never upscale
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_DIMENSION)
          width  = MAX_DIMENSION
        } else {
          width  = Math.round((width / height) * MAX_DIMENSION)
          height = MAX_DIMENSION
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Preserve format: PNG stays PNG (lossless), everything else → JPEG
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const quality  = mimeType === 'image/png' ? 1 : QUALITY

      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Canvas compression failed')),
        mimeType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = url
  })
}

/**
 * Uploads a file to Cloudinary.
 *
 * @param {File}   file    - The image file to upload
 * @param {string} folder  - Cloudinary folder e.g. 'orders', 'gallery', 'customers', 'invoices'
 * @param {function} onProgress - Optional callback (0–100)
 * @returns {Promise<string>} - The secure Cloudinary URL
 */
export async function uploadToCloudinary(file, folder = 'general', onProgress = null) {
  // 1. Compress
  const compressed = await compressImage(file)

  // 2. Build form data
  const formData = new FormData()
  formData.append('file',          compressed)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder',        `sewpadi/${folder}`)

  // 3. Upload via XHR so we can track progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', UPLOAD_URL)

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve(data.secure_url)
        } catch {
          reject(new Error('Invalid Cloudinary response'))
        }
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(formData)
  })
}

/**
 * Deletes a Cloudinary image by its public_id.
 * NOTE: Deletion from the frontend requires a signed request or
 * a backend/Cloud Function. For now this is a no-op placeholder.
 * Old base64 images in Firestore are unaffected.
 */
export async function deleteFromCloudinary(publicId) {
  // Implement via a Firebase Cloud Function if needed.
  console.warn('[Cloudinary] Client-side deletion not supported. Use a Cloud Function.', publicId)
}

/**
 * Checks whether a string is a base64 image (legacy Firestore data).
 * Useful to conditionally show old base64 images while new ones use URLs.
 */
export function isBase64Image(str) {
  return typeof str === 'string' && str.startsWith('data:image')
}

/**
 * Returns true if the string is a Cloudinary URL.
 */
export function isCloudinaryUrl(str) {
  return typeof str === 'string' && str.includes('cloudinary.com')
}
