"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, AlertTriangle, Image as ImageIcon } from "lucide-react";

export function OilSpillDetectionPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/predict`;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const uploaded = e.target.files[0];
    setFile(uploaded);
    setPreview(URL.createObjectURL(uploaded));
    setResult(null);
  };

  const handlePredict = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(API_URL, { method: "POST", body: formData });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ImageIcon className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">Oil Spill Detection</h2>
          <p className="text-sm text-muted-foreground">AI-powered satellite image analysis</p>
        </div>
      </div>

      {/* Upload and Results Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Satellite Image
            </CardTitle>
            <CardDescription>Supported formats: JPG, JPEG, PNG</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Custom File Input */}
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-semibold text-foreground">Click to upload image</p>
                <p className="text-xs text-muted-foreground">or drag and drop</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {preview && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Preview:</p>
                <img
                  src={preview}
                  alt="preview"
                  className="rounded-lg w-full h-48 object-contain shadow-md border"
                />
                <p className="text-xs text-muted-foreground">
                  {file?.name}
                </p>
              </div>
            )}

            <Button
              disabled={!file || loading}
              className="w-full"
              onClick={handlePredict}
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Detect Oil Spill
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="space-y-6">
          {result && (
            <>
              {/* Alert */}
              {result?.is_spill && (
                <Alert className="border-red-500 bg-red-100">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-700 font-bold">
                    ⚠️ Oil Spill Detected
                  </AlertTitle>
                  <AlertDescription className="text-red-600">
                    AI has detected a <strong>potential oil spill</strong> in the image.
                  </AlertDescription>
                </Alert>
              )}

              {result && result?.is_spill === false && (
                <Alert className="border-green-500 bg-green-100">
                  <AlertTriangle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700 font-bold">
                    ✓ No Oil Spill Detected
                  </AlertTitle>
                  <AlertDescription className="text-green-600">
                    The image does not contain an oil spill.
                  </AlertDescription>
                </Alert>
              )}

              {/* Results Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Detection Result</CardTitle>
                  <CardDescription>AI prediction & analysis</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Prediction */}
                  <div className="p-4 rounded-lg bg-accent/50">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Prediction</p>
                    <p className="text-2xl font-bold text-foreground">
                      {result.prediction}
                    </p>
                  </div>

                  {/* Area Covered */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">Area Covered</p>
                      <p className="text-sm font-bold text-primary">{result.area_percent}%</p>
                    </div>
                    <Progress value={result.area_percent} className="h-2" />
                  </div>

                  {/* Overlay image */}
                  {result.overlay_image && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Detection Overlay:</p>
                      <img
                        src={`data:image/png;base64,${result.overlay_image}`}
                        className="w-full h-48 object-contain rounded-lg shadow border"
                        alt="overlay"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!result && (
            <Card className="flex items-center justify-center h-full min-h-96">
              <CardContent className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Upload an image to see detection results</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
