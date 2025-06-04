import axios from 'axios';
import fs from 'fs';
import path from 'path';

interface VisionLabel {
  description: string;
  score: number;
}

interface VisionObject {
  name: string;
  score: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ImageAnalysisResult {
  labels: VisionLabel[];
  objects: VisionObject[];
}


class VisionService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY || '';
    if (!this.apiKey) {
      console.error('GOOGLE_CLOUD_VISION_API_KEY is not set in environment variables');
    }
  }
 

  public async getImageAnalysis(imageUrl: string): Promise<{
    labels: string[];
    objects: VisionObject[];
  }> {
    try {
      const analysisResult = await this.analyzeImage(imageUrl);
      
      if (!analysisResult) {
        return { labels: [], objects: [] };
      }
      
      return {
        labels: analysisResult.labels.map(label => label.description),
        objects: analysisResult.objects
      };
    } catch (error) {
      console.error('Error getting image analysis:', error);
      return { labels: [], objects: [] };
    }
  }

  private async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult | null> {

    if (!this.apiKey) {
      console.error('Cannot analyze image: API key is not configured');
      return null;
    }

    try {
      const urlObj = new URL(imageUrl);
      const publicPath = urlObj.pathname.replace('/public', '');
      const imagePath = path.join(
        process.cwd(),
        'public',
        publicPath
      );
      const imageBuffer = fs.readFileSync(imagePath);
      const imageContent = imageBuffer.toString('base64');
      const requestBody = {
        requests: [{
          image: {
            content: imageContent
          },
          features: [
            { 
              type: 'LABEL_DETECTION',
              maxResults: 20, 
              model: 'builtin/latest'
            },
            { 
              type: 'OBJECT_LOCALIZATION',
              maxResults: 20, 
              model: 'builtin/latest'
            },
            {
              type: 'IMAGE_PROPERTIES', 
              maxResults: 20
            },
            {
              type: 'CROP_HINTS' 
            }
          ],
          imageContext: {
            languageHints: ['en'],  
            cropHintsParams: {
              aspectRatios: [1.0] 
            }
          }
        }]
      };

      const response = await axios.post(
        'https://vision.googleapis.com/v1/images:annotate',
        requestBody,
        {
          params: {
            key: this.apiKey
          },
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000  
        }
      );

      if (!response.data?.responses?.[0]) {
        throw new Error('Invalid response from Vision API');
      }

      const result = response.data.responses[0];

      const analysisResult: ImageAnalysisResult = {
        labels: (result.labelAnnotations || []).map((label: { description: string; score: number; topicality?: number }) => ({
          description: label.description,
          score: Math.max(label.score || 0, label.topicality || 0)
        })),
        objects: (result.localizedObjectAnnotations || []).map((obj: { 
          name: string; 
          score: number; 
          boundingPoly?: {
            normalizedVertices: Array<{ x: number; y: number; }>
          }
        }) => ({
          name: obj.name,
          score: obj.score,
          boundingBox: obj.boundingPoly ? {
            x: obj.boundingPoly.normalizedVertices[0]?.x || 0,
            y: obj.boundingPoly.normalizedVertices[0]?.y || 0,
            width: Math.abs((obj.boundingPoly.normalizedVertices[1]?.x || 0) - (obj.boundingPoly.normalizedVertices[0]?.x || 0)),
            height: Math.abs((obj.boundingPoly.normalizedVertices[2]?.y || 0) - (obj.boundingPoly.normalizedVertices[0]?.y || 0))
          } : undefined
        }))
      };


      return analysisResult;
    } catch (error) {
      console.error('Error analyzing image:', error);
      return null;
    }
  }

}

const visionService = new VisionService();

export default visionService; 