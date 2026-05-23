import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, FileText, FileBadge2 } from "lucide-react";

export default function ExtractUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("invoice");
  const [loading, setLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUpload = async (fileToUpload: File | null = file) => {
    if (!fileToUpload) {
      toast({ title: "No file selected", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("document_type", docType);

    try {
      const res = await fetch("http://localhost:8000/extract", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }
      
      toast({ title: "Extraction complete!", description: "Successfully structured your document." });
      navigate(`/extractions/${data.id}`);
    } catch (err: any) {
      toast({ title: "Error extracting document", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl flex gap-8 flex-col md:flex-row items-start">
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">Intelligent Data Extraction</h1>
          <p className="text-xl text-muted-foreground">
            Instantly turn your unstructured PDFs and documents into clean, structured JSON data.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center p-4 border rounded-xl bg-card text-card-foreground shadow-sm">
            <FileText className="h-8 w-8 mb-2 text-primary" />
            <span className="font-semibold">Invoice Parsing</span>
            <span className="text-sm text-center text-muted-foreground">Extract vendors, totals, & line items automatically</span>
          </div>
          <div className="flex flex-col items-center p-4 border rounded-xl bg-card text-card-foreground shadow-sm">
            <FileBadge2 className="h-8 w-8 mb-2 text-primary" />
            <span className="font-semibold">Resume Scanning</span>
            <span className="text-sm text-center text-muted-foreground">Pull out name, skills, and experience cleanly</span>
          </div>
        </div>
        
        <div className="pt-4">
          <Button variant="outline" size="lg" onClick={() => navigate("/extractions")}>
            View Past Extractions
          </Button>
        </div>
      </div>

      <Card className="w-full md:w-[400px] shadow-lg border-2">
        <CardHeader>
          <CardTitle>Process a Document</CardTitle>
          <CardDescription>Select the document type and upload your file below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="docType">Target Document Type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger id="docType" className="w-full">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="resume">Resume</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center text-center cursor-pointer ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragActive(false);
              const droppedFile = e.dataTransfer.files[0];
              if (droppedFile) {
                setFile(droppedFile);
              }
            }}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <UploadCloud className={`h-12 w-12 mb-4 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
            {file ? (
              <p className="font-medium text-sm truncate max-w-full px-4">{file.name}</p>
            ) : (
              <>
                <p className="font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PDF or TXT up to 10MB</p>
              </>
            )}
            <Input 
              id="file-upload" 
              type="file" 
              accept=".pdf,.txt" 
              className="hidden" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
            />
          </div>

          <Button 
            size="lg"
            className="w-full font-semibold"
            disabled={loading || !file} 
            onClick={() => handleUpload()}
          >
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {loading ? "Extracting Data..." : "Extract Structured Data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
