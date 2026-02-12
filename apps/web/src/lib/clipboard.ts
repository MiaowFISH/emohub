/**
 * Clipboard utility for copying images with format conversion support
 */

interface CopyResult {
  success: boolean
  error?: string
}

/**
 * Convert a blob to PNG format using canvas
 */
async function convertToPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)

        canvas.toBlob(
          (pngBlob) => {
            if (pngBlob) {
              resolve(pngBlob)
            } else {
              reject(new Error('Failed to convert to PNG'))
            }
          },
          'image/png'
        )
      } catch (error) {
        URL.revokeObjectURL(url)
        reject(error)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Copy an image to the system clipboard
 *
 * @param imageUrl - URL of the image to copy
 * @param format - 'original' (converts to PNG) or 'gif' (uses gifConvertFn)
 * @param gifConvertFn - Optional function to convert image to GIF blob (for 'gif' format)
 * @returns Result object with success status and optional error message
 */
export async function copyImageToClipboard(
  imageUrl: string,
  format: 'original' | 'gif',
  gifConvertFn?: () => Promise<Blob>
): Promise<CopyResult> {
  // Check if Clipboard API is available
  if (!navigator.clipboard || !navigator.clipboard.write) {
    return {
      success: false,
      error: 'Clipboard API not supported in this browser'
    }
  }

  try {
    let blob: Blob

    if (format === 'gif') {
      // Use provided GIF conversion function
      if (!gifConvertFn) {
        return {
          success: false,
          error: 'GIF conversion function not provided'
        }
      }

      try {
        blob = await gifConvertFn()
      } catch (error) {
        return {
          success: false,
          error: `Failed to convert to GIF: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    } else {
      // Fetch original image
      let response: Response
      try {
        response = await fetch(imageUrl)
        if (!response.ok) {
          return {
            success: false,
            error: `Failed to fetch image: ${response.statusText}`
          }
        }
      } catch (error) {
        return {
          success: false,
          error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }

      const originalBlob = await response.blob()

      // Always convert through canvas to guarantee valid image/png output.
      // Clipboard API strictly requires image/png — server responses may have
      // incorrect content-type or unsupported encoding that causes decode failures.
      try {
        blob = await convertToPng(originalBlob)
      } catch (error) {
        return {
          success: false,
          error: `Failed to convert to PNG: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }

    // Write to clipboard
    try {
      const clipboardItem = new ClipboardItem({
        [blob.type]: blob
      })
      await navigator.clipboard.write([clipboardItem])

      return { success: true }
    } catch (error) {
      // Check for permission denied
      if (error instanceof Error && error.name === 'NotAllowedError') {
        return {
          success: false,
          error: 'Clipboard permission denied. Please allow clipboard access.'
        }
      }

      return {
        success: false,
        error: `Failed to write to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
