import { fal } from "@fal-ai/client";
import { CONFIG } from "./config";

// Configure FAL client
if (CONFIG.FAL_API_KEY) {
  fal.config({
    credentials: CONFIG.FAL_API_KEY,
  });
}

export interface GenerateImageInput {
  prompt: string;
  num_images?: number;
  output_format?: string;
  sync_mode?: boolean;
}

export interface EditImageInput {
  prompt: string;
  image_urls: string[];
  num_images?: number;
  output_format?: string;
}

export interface GenerateVideoInput {
  prompt: string;
  aspect_ratio?: string;
  duration?: string;
  enhance_prompt?: boolean;
  auto_fix?: boolean;
  resolution?: string;
  generate_audio?: boolean;
}

export interface ImageToVideoInput {
  prompt: string;
  image_url: string;
  duration?: string;
  generate_audio?: boolean;
  resolution?: string;
}

export class FalClient {
  static async generateImage(input: GenerateImageInput) {
    try {
      const result = await fal.subscribe(CONFIG.FAL_MODEL, {
        input: {
          prompt: input.prompt,
          num_images: input.num_images || 1,
          output_format: input.output_format || 'jpeg',
          sync_mode: input.sync_mode || false
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach(console.log);
          }
        },
      });
      return result;
    } catch (error) {
      console.error('Image generation failed:', error);
      throw error;
    }
  }

  static async editImage(input: EditImageInput) {
    try {
      const result = await fal.subscribe(CONFIG.FAL_MODEL2, {
        input: {
          prompt: input.prompt,
          image_urls: input.image_urls,
          num_images: input.num_images || 1,
          output_format: input.output_format || 'jpeg'
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach(console.log);
          }
        },
      });
      return result;
    } catch (error) {
      console.error('Image editing failed:', error);
      throw error;
    }
  }

  static async generateVideo(input: GenerateVideoInput) {
    try {
      const result = await fal.subscribe(CONFIG.FAL_VIDEO_MODEL, {
        input: {
          prompt: input.prompt,
          aspect_ratio: input.aspect_ratio || "16:9",
          duration: input.duration || "8s",
          enhance_prompt: input.enhance_prompt ?? true,
          auto_fix: input.auto_fix ?? true,
          resolution: input.resolution || "720p",
          generate_audio: input.generate_audio ?? true
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach(console.log);
          }
        },
      });
      return result;
    } catch (error) {
      console.error('Video generation failed:', error);
      throw error;
    }
  }

  static async imageToVideo(input: ImageToVideoInput) {
    try {
      const result = await fal.subscribe(CONFIG.FAL_VIDEO_MODEL2, {
        input: {
          prompt: input.prompt,
          image_url: input.image_url,
          duration: input.duration || "8s",
          generate_audio: input.generate_audio ?? true,
          resolution: input.resolution || "720p"
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach(console.log);
          }
        },
      });
      return result;
    } catch (error) {
      console.error('Image to video failed:', error);
      throw error;
    }
  }
}
