/**
 * Utility functions for capturing chart images for AI analysis
 */

export interface ChartCaptureOptions {
    quality?: number; // 0.1 to 1.0
    format?: 'png' | 'jpeg';
    backgroundColor?: string;
    width?: number;
    height?: number;
}

export interface ChartCaptureResult {
    success: boolean;
    imageData?: string; // Base64 encoded image
    error?: string;
    dimensions?: {
        width: number;
        height: number;
    };
}

/**
 * Capture a chart element as a high-quality image
 */
export async function captureChartImage(
    element: HTMLElement,
    options: ChartCaptureOptions = {}
): Promise<ChartCaptureResult> {
    try {
        const {
            quality = 0.95,
            format = 'png',
            backgroundColor = '#ffffff',
            width,
            height
        } = options;

        // Get element dimensions
        const rect = element.getBoundingClientRect();
        const elementWidth = width || rect.width;
        const elementHeight = height || rect.height;

        if (elementWidth === 0 || elementHeight === 0) {
            return {
                success: false,
                error: 'Chart element has no dimensions'
            };
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return {
                success: false,
                error: 'Failed to get canvas context'
            };
        }

        // Set canvas dimensions with device pixel ratio for high quality
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = elementWidth * devicePixelRatio;
        canvas.height = elementHeight * devicePixelRatio;

        // Scale context to match device pixel ratio
        ctx.scale(devicePixelRatio, devicePixelRatio);

        // Set background color
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, elementWidth, elementHeight);

        // Try to use html2canvas if available, otherwise use native methods
        if (typeof window !== 'undefined' && (window as any).html2canvas) {
            const html2canvas = (window as any).html2canvas;

            const canvasResult = await html2canvas(element, {
                canvas,
                backgroundColor,
                scale: devicePixelRatio,
                useCORS: true,
                allowTaint: true,
                width: elementWidth,
                height: elementHeight
            });

            const imageData = canvasResult.toDataURL(`image/${format}`, quality);

            return {
                success: true,
                imageData,
                dimensions: {
                    width: elementWidth,
                    height: elementHeight
                }
            };
        } else {
            // Fallback: Use native canvas methods
            return await captureWithNativeMethods(element, canvas, ctx, format, quality);
        }

    } catch (error) {
        console.error('Chart capture failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Fallback method using native canvas drawing
 */
async function captureWithNativeMethods(
    element: HTMLElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    format: string,
    quality: number
): Promise<ChartCaptureResult> {
    try {
        // Get computed styles
        const computedStyle = window.getComputedStyle(element);

        // Draw element background
        ctx.fillStyle = computedStyle.backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Try to capture SVG elements (common in charts)
        const svgElements = element.querySelectorAll('svg');
        for (const svg of svgElements) {
            await drawSVGToCanvas(svg, ctx, element);
        }

        // Try to capture canvas elements (like lightweight-charts)
        const canvasElements = element.querySelectorAll('canvas');
        for (const canvasEl of canvasElements) {
            await drawCanvasToCanvas(canvasEl, ctx, element);
        }

        const imageData = canvas.toDataURL(`image/${format}`, quality);

        return {
            success: true,
            imageData,
            dimensions: {
                width: canvas.width,
                height: canvas.height
            }
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to capture with native methods'
        };
    }
}

/**
 * Draw SVG element to canvas
 */
async function drawSVGToCanvas(
    svg: SVGElement,
    ctx: CanvasRenderingContext2D,
    parentElement: HTMLElement
): Promise<void> {
    try {
        const svgRect = svg.getBoundingClientRect();
        const parentRect = parentElement.getBoundingClientRect();

        // Calculate relative position
        const x = svgRect.left - parentRect.left;
        const y = svgRect.top - parentRect.top;

        // Serialize SVG to string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);

        // Create blob and object URL
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        // Create image and draw to canvas
        const img = new Image();

        return new Promise((resolve, reject) => {
            img.onload = () => {
                ctx.drawImage(img, x, y, svgRect.width, svgRect.height);
                URL.revokeObjectURL(url);
                resolve();
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load SVG image'));
            };

            img.src = url;
        });

    } catch (error) {
        console.warn('Failed to draw SVG to canvas:', error);
    }
}

/**
 * Draw canvas element to another canvas
 */
async function drawCanvasToCanvas(
    sourceCanvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    parentElement: HTMLElement
): Promise<void> {
    try {
        const canvasRect = sourceCanvas.getBoundingClientRect();
        const parentRect = parentElement.getBoundingClientRect();

        // Calculate relative position
        const x = canvasRect.left - parentRect.left;
        const y = canvasRect.top - parentRect.top;

        // Draw the source canvas to the target canvas
        ctx.drawImage(sourceCanvas, x, y, canvasRect.width, canvasRect.height);

    } catch (error) {
        console.warn('Failed to draw canvas to canvas:', error);
    }
}

/**
 * Validate captured image data
 */
export function validateImageData(imageData: string): boolean {
    try {
        // Check if it's a valid data URL
        if (!imageData.startsWith('data:image/')) {
            return false;
        }

        // Check if it has base64 data
        const base64Part = imageData.split(',')[1];
        if (!base64Part || base64Part.length === 0) {
            return false;
        }

        // Try to decode base64 to verify it's valid
        atob(base64Part);

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get image dimensions from base64 data
 */
export function getImageDimensions(imageData: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight
            });
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        img.src = imageData;
    });
}

/**
 * Compress image data if it's too large
 */
export async function compressImageData(
    imageData: string,
    maxSizeKB: number = 500,
    quality: number = 0.8
): Promise<string> {
    try {
        // Check current size
        const currentSizeKB = (imageData.length * 3) / 4 / 1024; // Rough base64 size calculation

        if (currentSizeKB <= maxSizeKB) {
            return imageData;
        }

        // Create image element
        const img = new Image();

        return new Promise((resolve, reject) => {
            img.onload = () => {
                // Create canvas for compression
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Calculate new dimensions to reduce file size
                const scaleFactor = Math.sqrt(maxSizeKB / currentSizeKB);
                canvas.width = img.width * scaleFactor;
                canvas.height = img.height * scaleFactor;

                // Draw and compress
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const compressedData = canvas.toDataURL('image/jpeg', quality);

                resolve(compressedData);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image for compression'));
            };

            img.src = imageData;
        });

    } catch (error) {
        console.warn('Image compression failed, returning original:', error);
        return imageData;
    }
}