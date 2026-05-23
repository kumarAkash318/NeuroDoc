import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ExtractionList() {
  const [extractions, setExtractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/extractions")
      .then(res => res.json())
      .then(data => {
        setExtractions(data);
        setLoading(false);
      })
      .catch(err => {
        toast({ title: "Failed to load", variant: "destructive" });
        setLoading(false);
      });
  }, [toast]);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Upload
      </Button>
      <h1 className="text-3xl font-bold mb-6">Past Extractions</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : extractions.length === 0 ? (
        <p className="text-gray-500">No extractions found. Upload a file to get started!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {extractions.map(ext => (
             <Card key={ext.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/extractions/${ext.id}`)}>
               <CardHeader>
                 <CardTitle className="flex justify-between items-center text-lg">
                   <span className="truncate pr-2">{ext.filename}</span>
                   <Badge>{ext.document_type}</Badge>
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-sm text-gray-500">{new Date(ext.timestamp).toLocaleString()}</p>
               </CardContent>
             </Card>
          ))}
        </div>
      )}
    </div>
  );
}
